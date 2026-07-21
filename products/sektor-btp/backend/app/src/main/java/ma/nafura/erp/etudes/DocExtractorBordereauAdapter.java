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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

/**
 * Extraction adapter: turns an uploaded bordereau (PDF / spreadsheet) into a
 * draft LOT → SOUS_LOT → ARTICLE tree using the platform doc-extractor.
 *
 * <p>Schéma volontairement limité à 2 niveaux de regroupement (lot → sous-lot →
 * postes) pour garder l'appel LLM rapide — contrairement à l'import lots chantier
 * (3 niveaux) qui est trop lourd pour cette passe. Les unités sont normalisées
 * vers le référentiel {@code unit_of_measure}.
 */
@Component
@Primary
public class DocExtractorBordereauAdapter implements BordereauExtractionPort {

    private static final Logger log = LoggerFactory.getLogger(DocExtractorBordereauAdapter.class);

    /**
     * Cap PDF text for the light bordereau pass (platform default is 120k for full CPS).
     * Keeps latency down while covering typical BPU/DQE length.
     */
    private static final int BORDEREAU_MAX_PROMPT_CHARS = 60_000;

    private static final String POSTE_SCHEMA = """
            {
              "type": "object",
              "properties": {
                "code": { "type": "string" },
                "libelle": { "type": "string" },
                "unite": { "type": "string" },
                "quantite": { "type": "number" }
              },
              "required": ["libelle"]
            }
            """;

    /**
     * Sous-lot / section : postes only (pas de children imbriqués — trop lent
     * en structured output LLM et provoque des arbres incomplets).
     */
    private static final String SOUS_LOT_SCHEMA = """
            {
              "type": "object",
              "properties": {
                "code": { "type": "string" },
                "libelle": { "type": "string" },
                "postes": {
                  "type": "array",
                  "items": %s
                }
              },
              "required": ["libelle"]
            }
            """.formatted(POSTE_SCHEMA);

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
                      "children": {
                        "type": "array",
                        "items": %s
                      },
                      "postes": {
                        "type": "array",
                        "items": %s
                      }
                    },
                    "required": ["libelle"]
                  }
                }
              },
              "required": ["lots"]
            }
            """.formatted(SOUS_LOT_SCHEMA, POSTE_SCHEMA);

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
        long started = System.nanoTime();

        StatelessExtractionResponse response = extractionService.process(
                fileBytes,
                fileName,
                mimeType,
                BORDEREAU_SCHEMA,
                null,
                instructions,
                tenantId != null ? tenantId.toString() : null,
                BORDEREAU_MAX_PROMPT_CHARS);

        if (response.outcome() == StatelessExtractionResponse.Outcome.REJECTED
                || response.outcome() == StatelessExtractionResponse.Outcome.TECHNICAL_FAILURE) {
            throw new IllegalStateException("BORDEREAU_EXTRACTION_FAILED: " + firstIssue(response));
        }
        ImportTreeRequest tree = mapToTree(response.data());
        normalizeUnites(tree, codes);
        long elapsedMs = (System.nanoTime() - started) / 1_000_000L;
        int lots = tree.getArbre() != null ? tree.getArbre().size() : 0;
        int articles = countArticles(tree.getArbre());
        log.info(
                "Bordereau extraction finished in {} ms (file={}, outcome={}, lots={}, articles={})",
                elapsedMs,
                fileName,
                response.outcome(),
                lots,
                articles);
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
                estimatif » d'un dossier de consultation).

                PRIORITÉ ABSOLUE — les postes (articles chiffrables) :
                - Extrais TOUTES les lignes de prix avec code, libellé, unité et quantité.
                - Un résultat avec seulement des en-têtes de lots / sous-lots et 0 postes
                  est INACCEPTABLE.
                - Si le document est long, privilégie la complétude des postes plutôt que
                  une hiérarchie fine.

                HIERARCHIE (2 niveaux max) :
                - "lots" = lots racines uniquement (ex. « LOT 1 : Terrassement »).
                - "children" = sous-lots / sections SANS unité ni quantité
                  (ex. « SOUS LOT N° 2 »). Ne mets JAMAIS un sous-lot dans "lots".
                - "postes" = articles chiffrables ; rattache-les au lot ou au sous-lot
                  auquel ils appartiennent.
                - Un sous-lot n'a PAS de "children" imbriqués : seulement des "postes".
                - Ne PAS aplatir les postes dans le tableau "lots".

                Pour le champ « unite », utilise UNIQUEMENT un code du référentiel suivant
                (respecte la casse) : %s.
                Exemples de mapping : m³/M3 → M3 ; m² → M2 ; ml → ML ; kg → KG ; u/unité → U ;
                forfait → FF ; heures → H ; jours → J.
                Si l'unité du document ne correspond à aucun code, choisis le code le plus proche
                ou laisse null — n'invente pas de libellé libre.

                N'extrais QUE la structure du bordereau (lots, sous-lots, postes) —
                pas les descriptifs techniques longs du CCTP.
                N'invente aucune valeur : laisse vide ce qui n'est pas lisible.
                """.formatted(referentiel);
    }

    private static int countArticles(List<ImportNoeudDto> noeuds) {
        if (noeuds == null || noeuds.isEmpty()) {
            return 0;
        }
        int n = 0;
        for (ImportNoeudDto noeud : noeuds) {
            if (noeud == null) {
                continue;
            }
            if (DpgfNoeud.TYPE_ARTICLE.equalsIgnoreCase(
                    noeud.getType() != null ? noeud.getType() : "")) {
                n++;
            }
            n += countArticles(noeud.getEnfants());
        }
        return n;
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

    /** Package-visible for unit tests. */
    ImportTreeRequest mapToTree(JsonNode data) {
        ImportTreeRequest request = new ImportTreeRequest();
        if (data == null || !data.has("lots")) {
            return request;
        }
        for (JsonNode lotNode : data.get("lots")) {
            ImportNoeudDto lot = mapGrouping(lotNode, DpgfNoeud.TYPE_LOT, "Lot");
            request.getArbre().add(lot);
        }
        return request;
    }

    private ImportNoeudDto mapGrouping(JsonNode node, String type, String defaultLibelle) {
        ImportNoeudDto group = new ImportNoeudDto();
        group.setType(type);
        group.setCode(text(node, "code"));
        group.setLibelle(textOrDefault(node, "libelle", defaultLibelle));

        if (node.has("children") && node.get("children").isArray()) {
            for (JsonNode childNode : node.get("children")) {
                group.getEnfants().add(mapGrouping(childNode, DpgfNoeud.TYPE_SOUS_LOT, "Sous-lot"));
            }
        }
        if (node.has("postes") && node.get("postes").isArray()) {
            for (JsonNode posteNode : node.get("postes")) {
                group.getEnfants().add(mapPoste(posteNode));
            }
        }
        return group;
    }

    private ImportNoeudDto mapPoste(JsonNode posteNode) {
        ImportNoeudDto poste = new ImportNoeudDto();
        poste.setType(DpgfNoeud.TYPE_ARTICLE);
        poste.setCode(text(posteNode, "code"));
        poste.setLibelle(textOrDefault(posteNode, "libelle", "Poste"));
        poste.setUnite(text(posteNode, "unite"));
        poste.setQuantite(decimal(posteNode, "quantite"));
        poste.setDescriptif(text(posteNode, "descriptif"));
        poste.setMode(DpgfNoeud.MODE_FOURNI);
        return poste;
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
