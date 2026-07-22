package ma.nafura.erp.etudes;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;
import ma.nafura.etudes.api.request.ImportNoeudDto;
import ma.nafura.etudes.api.request.ImportTreeRequest;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import ma.nafura.etudes.service.bordereau.BordereauHybridAssembler;
import ma.nafura.etudes.service.bordereau.BordereauParseResult;
import ma.nafura.etudes.service.bordereau.PdfBordereauLayoutParser;
import ma.nafura.etudes.service.port.BordereauExtractionPort;
import ma.nafura.item.domain.model.UnitOfMeasure;
import ma.nafura.item.repository.UnitOfMeasureRepository;
import ma.nafura.platform.documents.docextractor.api.response.StatelessExtractionIssue;
import ma.nafura.platform.documents.docextractor.api.response.StatelessExtractionResponse;
import ma.nafura.platform.documents.docextractor.service.StatelessExtractionService;
import ma.nafura.platform.framework.context.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

/**
 * Extraction adapter: turns an uploaded bordereau (PDF / spreadsheet) into a
 * draft LOT → SOUS_LOT → ARTICLE tree using the platform doc-extractor.
 *
 * <p>When {@code nafura.etudes.bordereau.hybrid-enabled=true}, PDFs with a usable
 * text layer are parsed locally (geometry + columns) then classified by a compact
 * LLM call. Spreadsheets and low-quality PDFs keep the legacy full-document path.
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

    /** Compact classifier prompt — candidates only, not the full PDF. */
    private static final int HYBRID_MAX_PROMPT_CHARS = 80_000;

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

    private static final String HYBRID_CLASSIFY_SCHEMA = """
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
                        "items": {
                          "type": "object",
                          "properties": {
                            "code": { "type": "string" },
                            "libelle": { "type": "string" },
                            "articleRowIds": {
                              "type": "array",
                              "items": { "type": "string" }
                            }
                          },
                          "required": ["libelle", "articleRowIds"]
                        }
                      },
                      "articleRowIds": {
                        "type": "array",
                        "items": { "type": "string" }
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
    private final PdfBordereauLayoutParser layoutParser;
    private final BordereauHybridAssembler hybridAssembler;
    private final boolean hybridEnabled;

    @Autowired
    public DocExtractorBordereauAdapter(
            StatelessExtractionService extractionService,
            UnitOfMeasureRepository unitOfMeasureRepository,
            PdfBordereauLayoutParser layoutParser,
            BordereauHybridAssembler hybridAssembler,
            @Value("${nafura.etudes.bordereau.hybrid-enabled:false}") boolean hybridEnabled) {
        this.extractionService = extractionService;
        this.unitOfMeasureRepository = unitOfMeasureRepository;
        this.layoutParser = layoutParser;
        this.hybridAssembler = hybridAssembler;
        this.hybridEnabled = hybridEnabled;
    }

    /** Test helper — hybrid disabled, no layout deps required for mapToTree tests. */
    DocExtractorBordereauAdapter(
            StatelessExtractionService extractionService,
            UnitOfMeasureRepository unitOfMeasureRepository) {
        this(extractionService, unitOfMeasureRepository, null, null, false);
    }

    @Override
    public boolean isAvailable() {
        return true;
    }

    @Override
    public ImportTreeRequest extract(byte[] fileBytes, String fileName, String mimeType) {
        UUID tenantId = TenantContext.getTenantIdOrNull();
        List<String> codes = loadActiveUnitCodes(tenantId);
        long started = System.nanoTime();

        if (hybridEnabled && isPdf(mimeType, fileName) && layoutParser != null && hybridAssembler != null) {
            HybridAttempt hybrid = tryHybrid(fileBytes, fileName, tenantId, codes);
            if (hybrid.tree() != null) {
                long elapsedMs = (System.nanoTime() - started) / 1_000_000L;
                log.info(
                        "Bordereau extraction finished in {} ms (mode=hybrid, file={}, lots={}, articles={}, "
                                + "parseMs={}, classifyMs={}, candidates={}, priced={}, pages={}/{})",
                        elapsedMs,
                        fileName,
                        hybrid.lots(),
                        hybrid.articles(),
                        hybrid.parseMs(),
                        hybrid.classifyMs(),
                        hybrid.candidates(),
                        hybrid.priced(),
                        hybrid.coveredPages(),
                        hybrid.pageCount());
                return hybrid.tree();
            }
            log.info(
                    "Bordereau hybrid skipped → legacy (file={}, reason={})",
                    fileName,
                    hybrid.fallbackReason());
        }

        return extractLegacy(fileBytes, fileName, mimeType, tenantId, codes, started);
    }

    private HybridAttempt tryHybrid(
            byte[] fileBytes, String fileName, UUID tenantId, List<String> unitCodes) {
        long parseStart = System.nanoTime();
        BordereauParseResult parse = layoutParser.parse(fileBytes);
        long parseMs = (System.nanoTime() - parseStart) / 1_000_000L;

        if (!parse.usableForHybrid()) {
            return HybridAttempt.fallback(
                    parse.rejectReason() != null ? parse.rejectReason() : "not_usable",
                    parseMs);
        }

        int candidates = parse.articleCandidates().size();
        long priced = parse.articleCandidates().stream().filter(r -> r.hasPricing()).count();

        long classifyStart = System.nanoTime();
        try {
            String prompt = hybridAssembler.buildClassifierPrompt(parse);
            StatelessExtractionResponse response = extractionService.process(
                    prompt.getBytes(StandardCharsets.UTF_8),
                    fileName != null ? fileName + ".candidates.txt" : "bordereau.candidates.txt",
                    "text/plain",
                    HYBRID_CLASSIFY_SCHEMA,
                    null,
                    hybridClassifyInstructions(),
                    tenantId != null ? tenantId.toString() : null,
                    HYBRID_MAX_PROMPT_CHARS);
            long classifyMs = (System.nanoTime() - classifyStart) / 1_000_000L;

            if (response.outcome() == StatelessExtractionResponse.Outcome.REJECTED
                    || response.outcome() == StatelessExtractionResponse.Outcome.TECHNICAL_FAILURE) {
                return HybridAttempt.fallback(
                        "classify_" + firstIssue(response), parseMs, classifyMs);
            }

            ImportTreeRequest tree = hybridAssembler.assemble(parse, response.data());
            if (tree.getArbre() == null || tree.getArbre().isEmpty()) {
                return HybridAttempt.fallback("empty_tree_after_assemble", parseMs, classifyMs);
            }
            normalizeUnites(tree, unitCodes);
            int articles = countArticles(tree.getArbre());
            if (articles == 0) {
                return HybridAttempt.fallback("zero_articles", parseMs, classifyMs);
            }
            return new HybridAttempt(
                    tree,
                    null,
                    parseMs,
                    classifyMs,
                    candidates,
                    (int) priced,
                    parse.pagesWithCandidates().size(),
                    parse.pageCount(),
                    tree.getArbre().size(),
                    articles);
        } catch (RuntimeException ex) {
            long classifyMs = (System.nanoTime() - classifyStart) / 1_000_000L;
            log.warn("Bordereau hybrid classify failed: {}", ex.getMessage());
            return HybridAttempt.fallback("classify_exception: " + ex.getMessage(), parseMs, classifyMs);
        }
    }

    private ImportTreeRequest extractLegacy(
            byte[] fileBytes,
            String fileName,
            String mimeType,
            UUID tenantId,
            List<String> codes,
            long startedNanos) {
        String instructions = buildInstructions(codes);

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
        long elapsedMs = (System.nanoTime() - startedNanos) / 1_000_000L;
        int lots = tree.getArbre() != null ? tree.getArbre().size() : 0;
        int articles = countArticles(tree.getArbre());
        log.info(
                "Bordereau extraction finished in {} ms (mode=legacy, file={}, outcome={}, lots={}, articles={})",
                elapsedMs,
                fileName,
                response.outcome(),
                lots,
                articles);
        return tree;
    }

    private static String hybridClassifyInstructions() {
        return """
                Tu classifies des lignes de bordereau BTP déjà extraites localement.
                Retourne uniquement la hiérarchie lots → sous-lots (children) et les
                articleRowIds (identifiants fournis, ex. r12). N'invente aucun code,
                libellé, unité ou quantité d'article. Utilise les GROUPES détectés
                comme indices ; tu peux renommer/fusionner les lots. Chaque article
                doit apparaître au plus une fois. Les articles non rattachés seront
                récupérés automatiquement — privilégie une affectation correcte.
                """;
    }

    private static boolean isPdf(String mimeType, String fileName) {
        if (mimeType != null && mimeType.toLowerCase(Locale.ROOT).contains("pdf")) {
            return true;
        }
        return fileName != null && fileName.toLowerCase(Locale.ROOT).endsWith(".pdf");
    }

    private List<String> loadActiveUnitCodes(UUID tenantId) {
        if (tenantId == null || unitOfMeasureRepository == null) {
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

    private record HybridAttempt(
            ImportTreeRequest tree,
            String fallbackReason,
            long parseMs,
            long classifyMs,
            int candidates,
            int priced,
            int coveredPages,
            int pageCount,
            int lots,
            int articles) {

        static HybridAttempt fallback(String reason, long parseMs) {
            return fallback(reason, parseMs, 0L);
        }

        static HybridAttempt fallback(String reason, long parseMs, long classifyMs) {
            return new HybridAttempt(null, reason, parseMs, classifyMs, 0, 0, 0, 0, 0, 0);
        }
    }
}
