package ma.nafura.catalogue.adapters;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import ma.nafura.catalogue.service.port.LlmRapprochementPort;
import ma.nafura.platform.documents.docextractor.api.response.StatelessExtractionResponse;
import ma.nafura.platform.documents.docextractor.service.StatelessExtractionService;
import ma.nafura.platform.framework.context.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * L16b — LLM dernier recours pour le rapprochement catalogue (via doc-extractor / Gemini).
 * Ne persiste jamais ; le caller crée des ItemMatch SUGGERE.
 */
@Component
@Primary
public class LlmRapprochementAdapter implements LlmRapprochementPort {

    private static final Logger log = LoggerFactory.getLogger(LlmRapprochementAdapter.class);

    private static final String RESPONSE_SCHEMA = """
            {
              "type": "object",
              "properties": {
                "matches": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "catalogCle": { "type": "string" },
                      "confiance": { "type": "number" }
                    },
                    "required": ["catalogCle", "confiance"]
                  }
                }
              },
              "required": ["matches"]
            }
            """;

    private final StatelessExtractionService extractionService;

    public LlmRapprochementAdapter(StatelessExtractionService extractionService) {
        this.extractionService = extractionService;
    }

    @Override
    public boolean isAvailable() {
        return true;
    }

    @Override
    public List<Suggestion> suggerer(String libelle, List<CatalogueSnippet> corpus, int limit) {
        if (!StringUtils.hasText(libelle) || corpus == null || corpus.isEmpty()) {
            return List.of();
        }
        int safeLimit = limit > 0 ? Math.min(limit, 10) : 5;
        // Cap corpus sent to LLM — top by simple token overlap, else head
        List<CatalogueSnippet> shortlist = shortlist(libelle, corpus, Math.min(80, corpus.size()));
        Map<String, CatalogueSnippet> byCle = new HashMap<>();
        for (CatalogueSnippet s : shortlist) {
            if (s != null && StringUtils.hasText(s.catalogCle())) {
                byCle.put(s.catalogCle(), s);
            }
        }
        if (byCle.isEmpty()) {
            return List.of();
        }

        UUID tenant = TenantContext.getTenantIdOrNull();
        String tenantId = tenant != null ? tenant.toString() : null;
        String prompt = buildPrompt(libelle, shortlist, safeLimit);

        StatelessExtractionResponse response = extractionService.process(
                prompt.getBytes(StandardCharsets.UTF_8),
                "rapprochement-llm.txt",
                "text/plain",
                RESPONSE_SCHEMA,
                null,
                """
                Tu rapproches un libellé saisi par un chiffreur BTP vers des entrées
                d'un catalogue métier. Renvoie UNIQUEMENT des catalogCle présents dans
                la liste fournie. N'invente aucune clé. Si aucun rapprochement crédible,
                renvoie matches vide. confiance entre 0 et 1.
                """,
                tenantId,
                30_000);

        if (response.outcome() == StatelessExtractionResponse.Outcome.REJECTED
                || response.outcome() == StatelessExtractionResponse.Outcome.TECHNICAL_FAILURE) {
            log.warn("LlmRapprochement failed: {}", response.outcome());
            return List.of();
        }
        return parse(response.data(), byCle, safeLimit);
    }

    private static List<CatalogueSnippet> shortlist(
            String libelle, List<CatalogueSnippet> corpus, int max) {
        String q = libelle.toLowerCase(Locale.ROOT);
        String[] qTokens = q.split("[^a-z0-9àâäéèêëïîôùûüç]+");
        List<Scored> scored = new ArrayList<>();
        for (CatalogueSnippet s : corpus) {
            if (s == null || !StringUtils.hasText(s.libelle())) {
                continue;
            }
            String c = s.libelle().toLowerCase(Locale.ROOT);
            int hit = 0;
            for (String t : qTokens) {
                if (t.length() >= 3 && c.contains(t)) {
                    hit++;
                }
            }
            scored.add(new Scored(s, hit));
        }
        scored.sort((a, b) -> Integer.compare(b.score, a.score));
        List<CatalogueSnippet> out = new ArrayList<>();
        for (int i = 0; i < scored.size() && out.size() < max; i++) {
            out.add(scored.get(i).snippet);
        }
        return out;
    }

    private static String buildPrompt(String libelle, List<CatalogueSnippet> corpus, int limit) {
        StringBuilder sb = new StringBuilder();
        sb.append("Libellé source : ").append(libelle.trim()).append("\n\n");
        sb.append("Catalogue (choisir au plus ").append(limit).append(") :\n");
        for (CatalogueSnippet s : corpus) {
            sb.append("- cle=")
                    .append(s.catalogCle())
                    .append(" | ")
                    .append(s.libelle())
                    .append(" | ")
                    .append(s.nature() != null ? s.nature() : "")
                    .append(" | ")
                    .append(s.uniteCode() != null ? s.uniteCode() : "")
                    .append('\n');
        }
        return sb.toString();
    }

    private static List<Suggestion> parse(
            JsonNode data, Map<String, CatalogueSnippet> byCle, int limit) {
        if (data == null || !data.has("matches") || !data.get("matches").isArray()) {
            return List.of();
        }
        Set<String> seen = new HashSet<>();
        List<Suggestion> out = new ArrayList<>();
        for (JsonNode node : data.get("matches")) {
            if (node == null || !node.has("catalogCle")) {
                continue;
            }
            String cle = node.get("catalogCle").asText("").trim();
            if (!StringUtils.hasText(cle) || !byCle.containsKey(cle) || !seen.add(cle)) {
                continue;
            }
            CatalogueSnippet snip = byCle.get(cle);
            double conf = node.has("confiance") && node.get("confiance").isNumber()
                    ? node.get("confiance").asDouble(0.5)
                    : 0.5;
            conf = Math.max(0.0, Math.min(1.0, conf));
            out.add(new Suggestion(
                    snip.catalogCle(),
                    snip.libelle(),
                    snip.nature(),
                    snip.uniteCode(),
                    BigDecimal.valueOf(conf).setScale(4, RoundingMode.HALF_UP)));
            if (out.size() >= limit) {
                break;
            }
        }
        return out;
    }

    private record Scored(CatalogueSnippet snippet, int score) {}
}
