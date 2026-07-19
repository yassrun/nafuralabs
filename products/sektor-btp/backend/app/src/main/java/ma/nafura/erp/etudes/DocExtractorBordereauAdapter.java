package ma.nafura.erp.etudes;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.util.UUID;
import ma.nafura.etudes.api.request.ImportNoeudDto;
import ma.nafura.etudes.api.request.ImportTreeRequest;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import ma.nafura.etudes.service.port.BordereauExtractionPort;
import ma.nafura.platform.documents.docextractor.api.response.StatelessExtractionIssue;
import ma.nafura.platform.documents.docextractor.api.response.StatelessExtractionResponse;
import ma.nafura.platform.documents.docextractor.service.StatelessExtractionService;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

/**
 * v1 extraction adapter: turns an uploaded bordereau (PDF / spreadsheet) into a
 * draft LOT -> ARTICLE tree using the platform doc-extractor. The CPS itself is
 * never fully sent here — only the (short, tabular) bordereau is extracted;
 * descriptifs remain manual until the RAG-based descriptif resolver ships.
 * Presence of this bean disables the No-Op default.
 * Declared {@code @Primary} so it wins injection over the No-Op fallback.
 */
@Component
@Primary
public class DocExtractorBordereauAdapter implements BordereauExtractionPort {

    private static final String BORDEREAU_SCHEMA = """
            {
              "type": "object",
              "properties": {
                "lots": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "code": { "type": "string" },
                      "libelle": { "type": "string" },
                      "postes": {
                        "type": "array",
                        "items": {
                          "type": "object",
                          "properties": {
                            "code": { "type": "string" },
                            "libelle": { "type": "string" },
                            "unite": { "type": "string" },
                            "quantite": { "type": "number" }
                          },
                          "required": ["libelle"]
                        }
                      }
                    },
                    "required": ["libelle"]
                  }
                }
              },
              "required": ["lots"]
            }
            """;

    private static final String INSTRUCTIONS = """
            Ce document est un bordereau de prix BTP (ou la partie « bordereau / détail
            estimatif » d'un dossier de consultation). Regroupe les lignes par lot / section.
            Chaque ligne de prix devient un poste avec son code, son libellé, son unité et sa
            quantité si présents.

            N'extrais ici QUE la structure du bordereau (lots et postes chiffrables) — pas les
            descriptifs techniques longs du CCTP, qui sont récupérés dans une seconde passe.
            N'invente aucune valeur : laisse vide ce qui n'est pas lisible.
            """;

    private final StatelessExtractionService extractionService;

    public DocExtractorBordereauAdapter(StatelessExtractionService extractionService) {
        this.extractionService = extractionService;
    }

    @Override
    public boolean isAvailable() {
        return true;
    }

    @Override
    public ImportTreeRequest extract(byte[] fileBytes, String fileName, String mimeType) {
        UUID tenantId = TenantContext.getTenantId();
        StatelessExtractionResponse response = extractionService.process(
                fileBytes,
                fileName,
                mimeType,
                BORDEREAU_SCHEMA,
                null,
                INSTRUCTIONS,
                tenantId != null ? tenantId.toString() : null);

        if (response.outcome() == StatelessExtractionResponse.Outcome.REJECTED
                || response.outcome() == StatelessExtractionResponse.Outcome.TECHNICAL_FAILURE) {
            throw new IllegalStateException("BORDEREAU_EXTRACTION_FAILED: " + firstIssue(response));
        }
        return mapToTree(response.data());
    }

    private ImportTreeRequest mapToTree(JsonNode data) {
        ImportTreeRequest request = new ImportTreeRequest();
        if (data == null || !data.has("lots")) {
            return request;
        }
        for (JsonNode lotNode : data.get("lots")) {
            ImportNoeudDto lot = new ImportNoeudDto();
            lot.setType(DpgfNoeud.TYPE_LOT);
            lot.setCode(text(lotNode, "code"));
            lot.setLibelle(textOrDefault(lotNode, "libelle", "Lot"));
            if (lotNode.has("postes")) {
                for (JsonNode posteNode : lotNode.get("postes")) {
                    ImportNoeudDto poste = new ImportNoeudDto();
                    poste.setType(DpgfNoeud.TYPE_ARTICLE);
                    poste.setCode(text(posteNode, "code"));
                    poste.setLibelle(textOrDefault(posteNode, "libelle", "Poste"));
                    poste.setUnite(text(posteNode, "unite"));
                    poste.setQuantite(decimal(posteNode, "quantite"));
                    poste.setDescriptif(text(posteNode, "descriptif"));
                    poste.setMode(DpgfNoeud.MODE_FOURNI);
                    lot.getEnfants().add(poste);
                }
            }
            request.getArbre().add(lot);
        }
        return request;
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value != null && !value.isNull() && value.isTextual() && !value.asText().isBlank()
                ? value.asText().trim()
                : null;
    }

    private String textOrDefault(JsonNode node, String field, String fallback) {
        String value = text(node, field);
        return value != null ? value : fallback;
    }

    private BigDecimal decimal(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        if (value.isNumber()) {
            return value.decimalValue();
        }
        try {
            return new BigDecimal(value.asText().trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private String firstIssue(StatelessExtractionResponse response) {
        if (response.issues() == null || response.issues().isEmpty()) {
            return response.outcome().name();
        }
        StatelessExtractionIssue issue = response.issues().get(0);
        return issue.code() + " — " + issue.message();
    }
}
