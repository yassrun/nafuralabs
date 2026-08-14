package ma.nafura.etudes.adapters;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.List;
import ma.nafura.etudes.domain.cps.CpsSection;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.service.port.DecompositionNeedsPort;
import ma.nafura.platform.documents.docextractor.api.response.StatelessExtractionResponse;
import ma.nafura.platform.documents.docextractor.service.StatelessExtractionService;
import ma.nafura.platform.framework.context.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Extrait des besoins de composants (désignation, type, unité, rendement) via Gemini.
 * N'invente aucun identifiant catalogue.
 */
@Component
@Primary
public class DocExtractorDecompositionNeedsAdapter implements DecompositionNeedsPort {

    private static final Logger log = LoggerFactory.getLogger(DocExtractorDecompositionNeedsAdapter.class);

    private static final String RESPONSE_SCHEMA = """
            {
              "type": "object",
              "properties": {
                "composants": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "designation": { "type": "string" },
                      "type": { "type": "string" },
                      "unite": { "type": "string" },
                      "rendement": { "type": "number" },
                      "confiance": { "type": "number" }
                    },
                    "required": ["designation", "type", "rendement"]
                  }
                },
                "confiance": { "type": "number" }
              },
              "required": ["composants"]
            }
            """;

    private final StatelessExtractionService extractionService;

    public DocExtractorDecompositionNeedsAdapter(StatelessExtractionService extractionService) {
        this.extractionService = extractionService;
    }

    @Override
    public boolean isAvailable() {
        return true;
    }

    @Override
    public List<BesoinComposant> extract(DpgfNoeud article, List<CpsSection> sections) {
        if (article == null) {
            return List.of();
        }
        String tenantId = TenantContext.getTenantId() != null
                ? TenantContext.getTenantId().toString()
                : null;
        String prompt = buildPrompt(article, sections);

        StatelessExtractionResponse response = extractionService.process(
                prompt.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                "decomposition-needs.txt",
                "text/plain",
                RESPONSE_SCHEMA,
                null,
                """
                Tu analyses un poste de bordereau BTP et les sections CPS fournies.
                Extrais les composants physiques ou de main-d'œuvre nécessaires pour
                réaliser UNE unité du poste. Types autorisés : MATIERE, MAIN_DOEUVRE,
                MATERIEL, SOUS_TRAITANCE. Donne un rendement (quantité pour 1 unité
                du poste). N'invente aucun prix ni identifiant catalogue. Si le CPS
                indique une classe (ex. béton B35), inclus-la dans la désignation.
                S'il n'y a rien d'exploitable, renvoie une liste vide.
                """,
                tenantId,
                40_000);

        if (response.outcome() == StatelessExtractionResponse.Outcome.REJECTED
                || response.outcome() == StatelessExtractionResponse.Outcome.TECHNICAL_FAILURE) {
            log.warn("Decomposition needs extraction failed: {}", response.outcome());
            return List.of();
        }
        return parse(response.data());
    }

    private static String buildPrompt(DpgfNoeud article, List<CpsSection> sections) {
        StringBuilder sb = new StringBuilder();
        sb.append("Poste :\n");
        sb.append("- code=").append(nullToEmpty(article.getCode())).append('\n');
        sb.append("- libelle=").append(nullToEmpty(article.getLibelle())).append('\n');
        if (StringUtils.hasText(article.getUnite())) {
            sb.append("- unite=").append(article.getUnite()).append('\n');
        }
        if (StringUtils.hasText(article.getDescriptif())) {
            sb.append("- descriptif=").append(article.getDescriptif()).append('\n');
        }
        sb.append('\n').append("Sections CPS candidates :\n");
        if (sections == null || sections.isEmpty()) {
            sb.append("(aucune)\n");
        } else {
            for (int i = 0; i < sections.size(); i++) {
                CpsSection s = sections.get(i);
                sb.append("\n--- SECTION ").append(i).append(" ---\n");
                sb.append("reference=").append(s.reference()).append('\n');
                sb.append(s.getContenu()).append('\n');
            }
        }
        return sb.toString();
    }

    private static List<BesoinComposant> parse(JsonNode data) {
        if (data == null || !data.has("composants") || !data.get("composants").isArray()) {
            return List.of();
        }
        List<BesoinComposant> out = new ArrayList<>();
        for (JsonNode node : data.get("composants")) {
            if (node == null || !node.has("designation")) {
                continue;
            }
            String designation = node.get("designation").asText("").trim();
            if (!StringUtils.hasText(designation)) {
                continue;
            }
            String type = node.has("type") ? node.get("type").asText("MATIERE") : "MATIERE";
            String unite = node.has("unite") ? node.get("unite").asText("").trim() : "";
            double rendement = node.has("rendement") && node.get("rendement").isNumber()
                    ? node.get("rendement").asDouble(1.0)
                    : 1.0;
            double confiance = node.has("confiance") && node.get("confiance").isNumber()
                    ? node.get("confiance").asDouble(0.6)
                    : 0.6;
            out.add(new BesoinComposant(designation, type, unite, Math.max(rendement, 0.0001), confiance));
        }
        return out;
    }

    private static String nullToEmpty(String value) {
        return value != null ? value : "";
    }
}
