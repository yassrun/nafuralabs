package ma.nafura.erp.etudes;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import ma.nafura.etudes.api.request.ImportNoeudDto;
import ma.nafura.etudes.api.request.ImportTreeRequest;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import ma.nafura.etudes.service.port.BordereauExtractionPort;
import ma.nafura.item.domain.model.UnitOfMeasure;
import ma.nafura.item.repository.UnitOfMeasureRepository;
import ma.nafura.platform.documents.docextractor.api.response.StatelessExtractionIssue;
import ma.nafura.platform.documents.docextractor.api.response.StatelessExtractionResponse;
import ma.nafura.platform.documents.docextractor.service.StatelessExtractionService;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

/**
 * v1 extraction adapter: turns an uploaded bordereau (PDF / spreadsheet) into a
 * draft LOT -> ARTICLE tree using the platform doc-extractor.
 *
 * <p>Les unités sont contraintes / normalisées vers le référentiel {@code unit_of_measure}.
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

    private final StatelessExtractionService extractionService;
    private final UnitOfMeasureRepository unitOfMeasureRepository;

    public DocExtractorBordereauAdapter(
            StatelessExtractionService extractionService,
            UnitOfMeasureRepository unitOfMeasureRepository) {
        this.extractionService = extractionService;
        this.unitOfMeasureRepository = unitOfMeasureRepository;
    }

    @Override
    public boolean isAvailable() {
        return true;
    }

    @Override
    public ImportTreeRequest extract(byte[] fileBytes, String fileName, String mimeType) {
        UUID tenantId = TenantContext.getTenantId();
        List<String> codes = loadActiveUnitCodes(tenantId);
        String instructions = buildInstructions(codes);

        StatelessExtractionResponse response = extractionService.process(
                fileBytes,
                fileName,
                mimeType,
                BORDEREAU_SCHEMA,
                null,
                instructions,
                tenantId != null ? tenantId.toString() : null);

        if (response.outcome() == StatelessExtractionResponse.Outcome.REJECTED
                || response.outcome() == StatelessExtractionResponse.Outcome.TECHNICAL_FAILURE) {
            throw new IllegalStateException("BORDEREAU_EXTRACTION_FAILED: " + firstIssue(response));
        }
        ImportTreeRequest tree = mapToTree(response.data());
        normalizeUnites(tree, codes);
        return tree;
    }

    private List<String> loadActiveUnitCodes(UUID tenantId) {
        if (tenantId == null) {
            return List.of();
        }
        return unitOfMeasureRepository.findAll().stream()
                .filter(u -> tenantId.equals(u.getTenantId()))
                .filter(u -> u.getIsActive() == null || Boolean.TRUE.equals(u.getIsActive()))
                .map(UnitOfMeasure::getCode)
                .filter(c -> c != null && !c.isBlank())
                .map(String::trim)
                .distinct()
                .sorted()
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private static String buildInstructions(List<String> codes) {
        String referentiel = codes.isEmpty()
                ? "M3, M2, ML, KG, T, U, FF, H, J, L, ENS"
                : String.join(", ", codes);
        return """
                Ce document est un bordereau de prix BTP (ou la partie « bordereau / détail
                estimatif » d'un dossier de consultation). Regroupe les lignes par lot / section.
                Chaque ligne de prix devient un poste avec son code, son libellé, son unité et sa
                quantité si présents.

                Pour le champ « unite », utilise UNIQUEMENT un code du référentiel suivant
                (respecte la casse) : %s.
                Exemples de mapping : m³/M3 → M3 ; m² → M2 ; ml → ML ; kg → KG ; u/unité → U ;
                forfait → FF ; heures → H ; jours → J.
                Si l'unité du document ne correspond à aucun code, choisis le code le plus proche
                ou laisse null — n'invente pas de libellé libre.

                N'extrais ici QUE la structure du bordereau (lots et postes chiffrables) — pas les
                descriptifs techniques longs du CCTP, qui sont récupérés dans une seconde passe.
                N'invente aucune valeur : laisse vide ce qui n'est pas lisible.
                """.formatted(referentiel);
    }

    private void normalizeUnites(ImportTreeRequest tree, List<String> codes) {
        if (tree == null || tree.getArbre() == null) {
            return;
        }
        walkNormalize(tree.getArbre(), codes);
    }

    private void walkNormalize(List<ImportNoeudDto> noeuds, List<String> codes) {
        for (ImportNoeudDto noeud : noeuds) {
            if (noeud == null) {
                continue;
            }
            if (DpgfNoeud.TYPE_ARTICLE.equalsIgnoreCase(
                    noeud.getType() != null ? noeud.getType() : DpgfNoeud.TYPE_ARTICLE)) {
                noeud.setUnite(UniteNormalizer.normalize(noeud.getUnite(), codes));
            }
            if (noeud.getEnfants() != null && !noeud.getEnfants().isEmpty()) {
                walkNormalize(noeud.getEnfants(), codes);
            }
        }
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
