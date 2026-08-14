package ma.nafura.etudes.adapters;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.model.CpsSection;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import ma.nafura.etudes.service.cps.DescriptifCpsPort;
import ma.nafura.platform.documents.docextractor.api.response.StatelessExtractionResponse;
import ma.nafura.platform.documents.docextractor.service.StatelessExtractionService;
import ma.nafura.platform.framework.context.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Propose un descriptif technique à partir des seules sections CPS déjà retenues
 * par la recherche Postgres — jamais le CPS entier.
 *
 * <p>Remplace le chemin batch {@code CpsDescriptifExtractionPort} (fichier complet × N)
 * pour le parcours wizard Études. La suggestion n'est jamais persistée ici.
 */
@Component
@Primary
public class DocExtractorDescriptifCpsAdapter implements DescriptifCpsPort {

    private static final Logger log = LoggerFactory.getLogger(DocExtractorDescriptifCpsAdapter.class);

    private static final String RESPONSE_SCHEMA = """
            {
              "type": "object",
              "properties": {
                "descriptif": { "type": "string" },
                "sectionIndex": { "type": "integer" },
                "confiance": { "type": "number" }
              },
              "required": ["descriptif", "sectionIndex"]
            }
            """;

    private final StatelessExtractionService extractionService;

    public DocExtractorDescriptifCpsAdapter(StatelessExtractionService extractionService) {
        this.extractionService = extractionService;
    }

    @Override
    public boolean isAvailable() {
        return true;
    }

    @Override
    public Optional<DescriptifPropose> proposer(DpgfNoeud article, List<CpsSection> sections) {
        if (article == null || sections == null || sections.isEmpty()) {
            return Optional.empty();
        }

        String tenantId = TenantContext.getTenantId() != null
                ? TenantContext.getTenantId().toString()
                : null;
        String prompt = buildPrompt(article, sections);

        // Text-only call: no PDF bytes. Mime hints the routing toward prompt text.
        StatelessExtractionResponse response = extractionService.process(
                prompt.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                "cps-sections.txt",
                "text/plain",
                RESPONSE_SCHEMA,
                null,
                """
                Tu rédiges le descriptif technique d'un poste de bordereau BTP à partir
                des sections CPS fournies. Recopie le passage pertinent VERBATIM (sans
                résumer). Indique sectionIndex (0-based) de la section source et un score
                confiance entre 0 et 1. N'invente rien. Si aucune section ne convient,
                laisse descriptif vide.
                """,
                tenantId,
                40_000);

        if (response.outcome() == StatelessExtractionResponse.Outcome.REJECTED
                || response.outcome() == StatelessExtractionResponse.Outcome.TECHNICAL_FAILURE) {
            log.warn("Descriptif CPS proposal failed: {} — fallback section CPS brute", response.outcome());
            return fallbackSection(sections);
        }

        Optional<DescriptifPropose> parsed = parse(response.data(), sections);
        return parsed.isPresent() ? parsed : fallbackSection(sections);
    }

    /**
     * Sans LLM exploitable : propose le contenu de la meilleure section Postgres
     * (déjà classée par pertinence). Suffit pour remonter B25/B35, dosages, etc.
     */
    private static Optional<DescriptifPropose> fallbackSection(List<CpsSection> sections) {
        CpsSection best = sections.get(0);
        if (!StringUtils.hasText(best.getContenu())) {
            return Optional.empty();
        }
        String texte = best.getContenu().trim();
        if (StringUtils.hasText(best.reference())) {
            texte = best.reference() + "\n" + texte;
        }
        return Optional.of(new DescriptifPropose(texte, best.getId(), 0.55));
    }

    private static String buildPrompt(DpgfNoeud article, List<CpsSection> sections) {
        StringBuilder sb = new StringBuilder();
        sb.append("Poste à décrire :\n");
        sb.append("- code=").append(nullToEmpty(article.getCode())).append('\n');
        sb.append("- libelle=").append(nullToEmpty(article.getLibelle())).append('\n');
        if (StringUtils.hasText(article.getUnite())) {
            sb.append("- unite=").append(article.getUnite()).append('\n');
        }
        sb.append('\n').append("Sections CPS candidates :\n");
        for (int i = 0; i < sections.size(); i++) {
            CpsSection s = sections.get(i);
            sb.append("\n--- SECTION ").append(i).append(" ---\n");
            sb.append("reference=").append(s.reference()).append('\n');
            sb.append(s.getContenu()).append('\n');
        }
        return sb.toString();
    }

    private static Optional<DescriptifPropose> parse(JsonNode data, List<CpsSection> sections) {
        if (data == null) {
            return Optional.empty();
        }
        JsonNode descNode = data.get("descriptif");
        if (descNode == null || !descNode.isTextual() || descNode.asText().isBlank()) {
            return Optional.empty();
        }
        int index = data.has("sectionIndex") && data.get("sectionIndex").isIntegralNumber()
                ? data.get("sectionIndex").asInt()
                : 0;
        if (index < 0 || index >= sections.size()) {
            index = 0;
        }
        double confiance = 0.7;
        if (data.has("confiance") && data.get("confiance").isNumber()) {
            confiance = Math.max(0.0, Math.min(1.0, data.get("confiance").asDouble()));
        }
        UUID sectionId = sections.get(index).getId();
        return Optional.of(new DescriptifPropose(descNode.asText().trim(), sectionId, confiance));
    }

    private static String nullToEmpty(String value) {
        return value != null ? value : "";
    }
}
