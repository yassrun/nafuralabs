package ma.nafura.erp.etudes;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import ma.nafura.etudes.api.request.ImportNoeudDto;
import ma.nafura.etudes.api.request.ImportTreeRequest;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import ma.nafura.etudes.service.bordereau.BordereauCandidateMerger;
import ma.nafura.etudes.service.bordereau.BordereauExtractionDiagnostics;
import ma.nafura.etudes.service.bordereau.BordereauHybridAssembler;
import ma.nafura.etudes.service.bordereau.BordereauParseResult;
import ma.nafura.etudes.service.bordereau.BordereauQualityReport;
import ma.nafura.etudes.service.bordereau.BordereauRowCandidate;
import ma.nafura.etudes.service.bordereau.PdfBordereauLayoutParser;
import ma.nafura.etudes.service.bordereau.PdfPageChunker;
import ma.nafura.item.domain.model.UnitOfMeasure;
import ma.nafura.item.repository.UnitOfMeasureRepository;
import ma.nafura.platform.documents.docextractor.api.response.StatelessExtractionIssue;
import ma.nafura.platform.documents.docextractor.api.response.StatelessExtractionResponse;
import ma.nafura.platform.documents.docextractor.service.StatelessExtractionService;
import ma.nafura.platform.framework.context.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Pipeline adaptatif : parse local d'abord ; si couche texte sale / scan → vision page/page
 * (forceMedia) ; classification hiérarchique locale préférée ; rejet des arbres à 0 articles.
 */
@Component
public class AdaptiveBordereauExtractionOrchestrator {

    private static final Logger log = LoggerFactory.getLogger(AdaptiveBordereauExtractionOrchestrator.class);

    private static final int BORDEREAU_MAX_PROMPT_CHARS = 60_000;
    private static final int HYBRID_MAX_PROMPT_CHARS = 80_000;
    /** Repair ciblé (pages faibles) : petits paquets. */
    private static final int CHUNK_MAX_PAGES = 3;
    /** Vision-first : 1 page = 1 appel (source de vérité visuelle). */
    private static final int VISION_PAGES_PER_CHUNK = 1;
    private static final int MAX_PARALLEL_CHUNKS = 2;
    private static final int VISION_MIN_ARTICLES_TO_TRUST = 8;

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

    private static final String CHUNK_REPAIR_SCHEMA = """
            {
              "type": "object",
              "properties": {
                "groups": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "code": { "type": "string" },
                      "libelle": { "type": "string" },
                      "kind": { "type": "string" }
                    },
                    "required": ["libelle"]
                  }
                },
                "articles": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "code": { "type": "string" },
                      "libelle": { "type": "string" },
                      "unite": { "type": "string" },
                      "quantite": { "type": "number" },
                      "page": { "type": "integer" }
                    },
                    "required": ["libelle"]
                  }
                }
              },
              "required": ["articles"]
            }
            """;

    private final StatelessExtractionService extractionService;
    private final UnitOfMeasureRepository unitOfMeasureRepository;
    private final PdfBordereauLayoutParser layoutParser;
    private final BordereauHybridAssembler hybridAssembler;
    private final BordereauCandidateMerger candidateMerger;
    private final PdfPageChunker pageChunker;
    private final TabularBordereauParser tabularParser;
    private final String strategy;

    private volatile BordereauExtractionDiagnostics lastDiagnostics =
            BordereauExtractionDiagnostics.empty();

    public AdaptiveBordereauExtractionOrchestrator(
            StatelessExtractionService extractionService,
            UnitOfMeasureRepository unitOfMeasureRepository,
            PdfBordereauLayoutParser layoutParser,
            BordereauHybridAssembler hybridAssembler,
            BordereauCandidateMerger candidateMerger,
            PdfPageChunker pageChunker,
            TabularBordereauParser tabularParser,
            @Value("${nafura.etudes.bordereau.strategy:adaptive}") String strategy) {
        this.extractionService = extractionService;
        this.unitOfMeasureRepository = unitOfMeasureRepository;
        this.layoutParser = layoutParser;
        this.hybridAssembler = hybridAssembler;
        this.candidateMerger = candidateMerger;
        this.pageChunker = pageChunker;
        this.tabularParser = tabularParser;
        this.strategy = strategy == null ? "adaptive" : strategy.trim().toLowerCase(Locale.ROOT);
    }

    public String strategy() {
        return strategy;
    }

    public BordereauExtractionDiagnostics consumeDiagnostics() {
        BordereauExtractionDiagnostics d = lastDiagnostics;
        lastDiagnostics = BordereauExtractionDiagnostics.empty();
        return d;
    }

    public ImportTreeRequest extract(byte[] fileBytes, String fileName, String mimeType) {
        UUID tenantId = TenantContext.getTenantIdOrNull();
        List<String> unitCodes = loadActiveUnitCodes(tenantId);
        long started = System.nanoTime();

        if ("legacy".equals(strategy)) {
            return extractLegacy(fileBytes, fileName, mimeType, tenantId, unitCodes, started, "legacy");
        }

        if ("vision".equals(strategy) && isPdf(mimeType, fileName)) {
            return extractVisionFirst(
                    fileBytes, fileName, mimeType, tenantId, unitCodes, started, "vision");
        }

        ImportTreeRequest adaptive = extractAdaptive(fileBytes, fileName, mimeType, tenantId, unitCodes, started);

        if ("shadow".equals(strategy)) {
            try {
                ImportTreeRequest legacy = extractLegacySilent(
                        fileBytes, fileName, mimeType, tenantId, unitCodes);
                int adaptiveArticles = countArticles(adaptive.getArbre());
                int legacyArticles = countArticles(legacy.getArbre());
                log.info(
                        "Bordereau shadow compare file={} adaptiveArticles={} legacyArticles={} strategy={}",
                        fileName,
                        adaptiveArticles,
                        legacyArticles,
                        strategy);
            } catch (RuntimeException ex) {
                log.warn("Bordereau shadow legacy compare failed: {}", ex.getMessage());
            }
        }
        return adaptive;
    }

    private ImportTreeRequest extractAdaptive(
            byte[] fileBytes,
            String fileName,
            String mimeType,
            UUID tenantId,
            List<String> unitCodes,
            long startedNanos) {

        if (tabularParser.supports(mimeType, fileName)) {
            long parseStart = System.nanoTime();
            BordereauParseResult parse = tabularParser.parse(fileBytes, fileName, mimeType);
            long parseMs = (System.nanoTime() - parseStart) / 1_000_000L;
            return finalizeFromParse(
                    parse, fileName, tenantId, unitCodes, parseMs, 0, 0, 0, "table", startedNanos);
        }

        if (!isPdf(mimeType, fileName)) {
            return extractLegacy(fileBytes, fileName, mimeType, tenantId, unitCodes, startedNanos, "legacy-non-pdf");
        }

        long parseStart = System.nanoTime();
        BordereauParseResult parse = layoutParser.parse(fileBytes);
        long parseMs = (System.nanoTime() - parseStart) / 1_000_000L;

        // Couche texte utilisable mais sale (libellés coupés / pas de LOT) → vision page/page.
        if (parse.usableForHybrid() && shouldEscalateToVision(parse)) {
            log.info(
                    "Bordereau adaptive → vision-first (file={}, articles={}, reason=dirty_text_layer)",
                    fileName,
                    parse.articleCandidates().size());
            return extractVisionFirst(
                    fileBytes, fileName, mimeType, tenantId, unitCodes, startedNanos, "adaptive-vision");
        }

        if (parse.usableForHybrid()) {
            SetWeakRepair repair = repairWeakPages(fileBytes, fileName, parse, tenantId);
            BordereauParseResult merged = candidateMerger.merge(parse, repair.extras());
            return finalizeFromParse(
                    merged,
                    fileName,
                    tenantId,
                    unitCodes,
                    parseMs,
                    repair.classifyMs(),
                    repair.repairMs(),
                    repair.repairedChunks(),
                    repair.extras().isEmpty() ? "hybrid-local" : "hybrid-repaired",
                    startedNanos);
        }

        // Scan / low-text density → vision/media chunks then legacy fallback
        if (parse.quality() == BordereauParseResult.Quality.INSUFFICIENT
                && ("low_text_density".equals(parse.rejectReason())
                        || "no_text_layer".equals(parse.rejectReason())
                        || "too_few_article_candidates".equals(parse.rejectReason()))) {
            return extractVisionFirst(
                    fileBytes, fileName, mimeType, tenantId, unitCodes, startedNanos, "vision-chunks");
        }

        log.info(
                "Bordereau adaptive → legacy fallback (file={}, reason={})",
                fileName,
                parse.rejectReason());
        return extractLegacy(
                fileBytes, fileName, mimeType, tenantId, unitCodes, startedNanos, "legacy-fallback");
    }

    private ImportTreeRequest finalizeFromParse(
            BordereauParseResult parse,
            String fileName,
            UUID tenantId,
            List<String> unitCodes,
            long parseMs,
            long classifyBudgetMs,
            long repairMs,
            int repairedChunks,
            String path,
            long startedNanos) {

        long classifyStart = System.nanoTime();
        ImportTreeRequest tree;
        long classifyMs = classifyBudgetMs;

        BordereauQualityReport pre = BordereauQualityReport.evaluate(parse, 0);
        long sousLotCount = parse.rows().stream()
                .filter(r -> r.kind() == BordereauRowCandidate.Kind.SOUS_LOT)
                .count();
        boolean localHierarchyOk = !parse.groupingCandidates().isEmpty()
                && pre.pricedRatio() >= 0.8
                && pre.articleCount() >= 3
                && pre.weakPages().isEmpty();
        // Clear "SOUS LOT N° X" chapters → prefer local promotion to root lots (no LLM invent).
        if (sousLotCount >= 2 && pre.pricedRatio() >= 0.7 && pre.articleCount() >= 10) {
            localHierarchyOk = true;
        }
        if (pre.highConfidence() || localHierarchyOk) {
            tree = hybridAssembler.assembleLocalOnly(parse);
            classifyMs = 0;
            path = path + "+local-hierarchy";
        } else {
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
                classifyMs = (System.nanoTime() - classifyStart) / 1_000_000L;
                if (response.outcome() == StatelessExtractionResponse.Outcome.REJECTED
                        || response.outcome() == StatelessExtractionResponse.Outcome.TECHNICAL_FAILURE) {
                    tree = hybridAssembler.assembleLocalOnly(parse);
                    path = path + "+classify-fallback-local";
                } else {
                    tree = hybridAssembler.assemble(parse, response.data());
                    path = path + "+classify";
                    if (hasMarketTitleRoot(tree)) {
                        tree = hybridAssembler.assembleLocalOnly(parse);
                        path = path + "+sanitize-local";
                    }
                }
            } catch (RuntimeException ex) {
                log.warn("Bordereau classify failed, using local hierarchy: {}", ex.getMessage());
                tree = hybridAssembler.assembleLocalOnly(parse);
                classifyMs = (System.nanoTime() - classifyStart) / 1_000_000L;
                path = path + "+classify-exception-local";
            }
        }

        normalizeUnites(tree, unitCodes);
        int articles = countArticles(tree.getArbre());
        if (articles == 0) {
            lastDiagnostics = new BordereauExtractionDiagnostics(
                    strategy, path, 0, parse.pageCount(), repairedChunks, 0, 0,
                    List.of("zero_articles"), parseMs, classifyMs, repairMs, null);
            throw new IllegalStateException(
                    "BORDEREAU_EXTRACTION_FAILED: ZERO_ARTICLES — aucun article exploitable extrait");
        }

        int orphans = countOrphans(tree);
        BordereauQualityReport report = BordereauQualityReport.evaluate(parse, orphans);
        if (!report.acceptable() && articles > 0) {
            log.warn(
                    "Bordereau quality below threshold but articles present (file={}, score={}, warnings={})",
                    fileName,
                    report.score(),
                    report.warnings());
        }

        lastDiagnostics = new BordereauExtractionDiagnostics(
                strategy,
                path,
                report.score(),
                parse.pageCount(),
                repairedChunks,
                articles,
                report.pricedCount(),
                report.warnings(),
                parseMs,
                classifyMs,
                repairMs,
                null);

        long elapsedMs = (System.nanoTime() - startedNanos) / 1_000_000L;
        log.info(
                "Bordereau extraction finished in {} ms (mode={}, path={}, file={}, lots={}, articles={}, "
                        + "score={}, parseMs={}, classifyMs={}, repairMs={}, repairedChunks={})",
                elapsedMs,
                strategy,
                path,
                fileName,
                tree.getArbre() != null ? tree.getArbre().size() : 0,
                articles,
                String.format(Locale.ROOT, "%.2f", report.score()),
                parseMs,
                classifyMs,
                repairMs,
                repairedChunks);
        return tree;
    }

    private SetWeakRepair repairWeakPages(
            byte[] fileBytes, String fileName, BordereauParseResult parse, UUID tenantId) {
        List<Integer> weak = new ArrayList<>(BordereauQualityReport.detectWeakPages(parse));
        if (weak.isEmpty()) {
            return SetWeakRepair.empty();
        }
        List<PdfPageChunker.PageChunk> chunks = pageChunker.chunksForPages(fileBytes, weak, CHUNK_MAX_PAGES);
        if (chunks.isEmpty()) {
            return SetWeakRepair.empty();
        }
        return runChunkRepairs(chunks, fileName, tenantId, false);
    }

    /**
     * Vision-first : une image/page (forceMedia), sans réutiliser le texte PDFBox sale.
     * Fallback PDFBox local ou legacy si la vision ne sort presque rien.
     */
    private ImportTreeRequest extractVisionFirst(
            byte[] fileBytes,
            String fileName,
            String mimeType,
            UUID tenantId,
            List<String> unitCodes,
            long startedNanos,
            String pathPrefix) {

        long parseStart = System.nanoTime();
        BordereauParseResult layoutHint = layoutParser.parse(fileBytes);
        long parseMs = (System.nanoTime() - parseStart) / 1_000_000L;

        int pages = Math.max(layoutHint.pageCount(), 1);
        List<Integer> allPages = new ArrayList<>(pages);
        for (int p = 1; p <= pages; p++) {
            allPages.add(p);
        }
        List<PdfPageChunker.PageChunk> chunks =
                pageChunker.chunksForPages(fileBytes, allPages, VISION_PAGES_PER_CHUNK);
        log.info(
                "Bordereau vision-first starting (file={}, pages={}, chunks={}, path={})",
                fileName,
                pages,
                chunks.size(),
                pathPrefix);

        SetWeakRepair vision = runChunkRepairs(chunks, fileName, tenantId, true);
        long visionArticles = vision.extras().stream()
                .filter(BordereauRowCandidate::looksLikeArticle)
                .count();

        if (visionArticles < VISION_MIN_ARTICLES_TO_TRUST) {
            log.warn(
                    "Bordereau vision-first weak (file={}, visionArticles={}) — falling back",
                    fileName,
                    visionArticles);
            if (layoutHint.usableForHybrid()) {
                BordereauParseResult merged = vision.extras().isEmpty()
                        ? layoutHint
                        : candidateMerger.merge(layoutHint, vision.extras());
                return finalizeFromParse(
                        merged,
                        fileName,
                        tenantId,
                        unitCodes,
                        parseMs,
                        0,
                        vision.repairMs(),
                        vision.repairedChunks(),
                        pathPrefix + "+fallback-local",
                        startedNanos);
            }
            return extractLegacy(
                    fileBytes,
                    fileName,
                    mimeType,
                    tenantId,
                    unitCodes,
                    startedNanos,
                    pathPrefix + "+fallback-legacy");
        }

        // Vision articles + groups, but keep PDFBox structure headers (LOT/SECTION titles
        // like « TERRASSEMENT - GROS-ŒUVRE ») — the text layer is bad for rows, good for chapters.
        List<BordereauRowCandidate> combined = new ArrayList<>();
        for (BordereauRowCandidate row : layoutHint.rows()) {
            if (row.kind() == BordereauRowCandidate.Kind.LOT
                    || row.kind() == BordereauRowCandidate.Kind.SOUS_LOT
                    || row.kind() == BordereauRowCandidate.Kind.SECTION) {
                combined.add(row);
            }
        }
        combined.addAll(vision.extras());
        BordereauParseResult seeded = layoutHint.withRows(combined);
        BordereauParseResult merged = candidateMerger.dedupe(seeded);
        return finalizeFromParse(
                merged,
                fileName,
                tenantId,
                unitCodes,
                parseMs,
                0,
                vision.repairMs(),
                vision.repairedChunks(),
                pathPrefix + "+pages",
                startedNanos);
    }

    /**
     * PDFBox a sorti assez d'articles mais la géométrie est sale (typique BDP multi-colonnes).
     */
    private static boolean shouldEscalateToVision(BordereauParseResult parse) {
        int articles = parse.articleCandidates().size();
        if (articles < 20) {
            return false;
        }
        long lots = parse.rows().stream()
                .filter(r -> r.kind() == BordereauRowCandidate.Kind.LOT)
                .count();
        // Beaucoup d'articles, aucun LOT clair → tables mal lues.
        if (lots == 0) {
            return true;
        }
        return truncatedLibelleRatio(parse) >= 0.25;
    }

    private static double truncatedLibelleRatio(BordereauParseResult parse) {
        List<BordereauRowCandidate> articles = parse.articleCandidates();
        if (articles.isEmpty()) {
            return 0;
        }
        long truncated = 0;
        for (BordereauRowCandidate a : articles) {
            String lib = a.libelle() == null ? "" : a.libelle().trim();
            if (lib.length() < 18 || startsLikeFragment(lib)) {
                truncated++;
            }
        }
        return truncated / (double) articles.size();
    }

    private static boolean startsLikeFragment(String libelle) {
        String first = libelle.split("\\s+")[0].toUpperCase(Locale.ROOT);
        return Set.of(
                        "DE", "DES", "DU", "LA", "LE", "LES", "ET", "OU", "EN", "DANS", "POUR",
                        "Y", "AUX", "AU", "SUR", "AVEC", "SANS", "COMPRIS", "Y/C", "MM", "CM",
                        "TRANCHEERS", "PUBLIQUES", "GALVANISÉE", "GALVANISEE", "PRINCIPAL",
                        "SUPPLEMENTAIRE", "MÉTALIQUE", "METALLIQUE")
                .contains(first);
    }

    private SetWeakRepair runChunkRepairs(
            List<PdfPageChunker.PageChunk> chunks,
            String fileName,
            UUID tenantId,
            boolean forceMedia) {
        long repairStart = System.nanoTime();
        ExecutorService pool = Executors.newFixedThreadPool(Math.min(MAX_PARALLEL_CHUNKS, chunks.size()));
        try {
            List<CompletableFuture<List<BordereauRowCandidate>>> futures = new ArrayList<>();
            for (PdfPageChunker.PageChunk chunk : chunks) {
                futures.add(CompletableFuture.supplyAsync(
                        () -> repairChunk(chunk, fileName, tenantId, forceMedia), pool));
            }
            List<BordereauRowCandidate> extras = new ArrayList<>();
            int repaired = 0;
            for (CompletableFuture<List<BordereauRowCandidate>> future : futures) {
                try {
                    List<BordereauRowCandidate> part = future.get(120, TimeUnit.SECONDS);
                    if (part != null && !part.isEmpty()) {
                        extras.addAll(part);
                        repaired++;
                    }
                } catch (Exception ex) {
                    log.warn("Bordereau chunk repair failed: {}", ex.getMessage());
                }
            }
            long repairMs = (System.nanoTime() - repairStart) / 1_000_000L;
            return new SetWeakRepair(extras, repaired, repairMs, 0);
        } finally {
            pool.shutdownNow();
        }
    }

    private List<BordereauRowCandidate> repairChunk(
            PdfPageChunker.PageChunk chunk,
            String fileName,
            UUID tenantId,
            boolean forceMedia) {
        String label = (fileName == null ? "bordereau" : fileName)
                + ".p" + chunk.startPage() + "-" + chunk.endPage() + ".pdf";
        StatelessExtractionResponse response = extractionService.process(
                chunk.pdfBytes(),
                label,
                "application/pdf",
                CHUNK_REPAIR_SCHEMA,
                null,
                chunkRepairInstructions(chunk.startPage(), chunk.endPage()),
                tenantId != null ? tenantId.toString() : null,
                BORDEREAU_MAX_PROMPT_CHARS,
                forceMedia);
        if (response.outcome() == StatelessExtractionResponse.Outcome.REJECTED
                || response.outcome() == StatelessExtractionResponse.Outcome.TECHNICAL_FAILURE
                || response.data() == null) {
            return List.of();
        }
        return mapChunkArticles(
                response.data(),
                chunk.startPage(),
                forceMedia
                        ? BordereauRowCandidate.ExtractionMethod.VISION
                        : BordereauRowCandidate.ExtractionMethod.LLM_TEXT);
    }

    private List<BordereauRowCandidate> mapChunkArticles(
            JsonNode data, int defaultPage, BordereauRowCandidate.ExtractionMethod method) {
        List<BordereauRowCandidate> rows = new ArrayList<>();
        int order = 0;
        if (data.has("groups") && data.get("groups").isArray()) {
            for (JsonNode g : data.get("groups")) {
                String libelle = text(g, "libelle");
                if (libelle == null) {
                    continue;
                }
                String kindRaw = text(g, "kind");
                BordereauRowCandidate.Kind kind = BordereauRowCandidate.Kind.SECTION;
                if (kindRaw != null && kindRaw.toUpperCase(Locale.ROOT).contains("SOUS")) {
                    kind = BordereauRowCandidate.Kind.SOUS_LOT;
                } else if (kindRaw != null && kindRaw.toUpperCase(Locale.ROOT).contains("LOT")) {
                    kind = BordereauRowCandidate.Kind.LOT;
                }
                rows.add(new BordereauRowCandidate(
                        "cg" + defaultPage + "_" + order,
                        defaultPage,
                        order++,
                        text(g, "code"),
                        libelle,
                        null,
                        null,
                        kind,
                        0.55,
                        libelle,
                        method,
                        libelle));
            }
        }
        if (data.has("articles") && data.get("articles").isArray()) {
            for (JsonNode a : data.get("articles")) {
                String libelle = text(a, "libelle");
                if (libelle == null) {
                    continue;
                }
                int page = a.has("page") && a.get("page").isInt() ? a.get("page").asInt() : defaultPage;
                String unite = UniteNormalizer.normalize(text(a, "unite"), List.of());
                BigDecimal qty = decimal(a, "quantite");
                BordereauRowCandidate.Kind kind = (unite != null || qty != null)
                        ? BordereauRowCandidate.Kind.ARTICLE
                        : BordereauRowCandidate.Kind.AMBIGUOUS;
                rows.add(new BordereauRowCandidate(
                        "cr" + page + "_" + order,
                        page,
                        order++,
                        text(a, "code"),
                        libelle,
                        unite,
                        qty,
                        kind,
                        (unite != null && qty != null) ? 0.7 : 0.5,
                        libelle,
                        method,
                        libelle));
            }
        }
        return rows;
    }

    private ImportTreeRequest extractLegacy(
            byte[] fileBytes,
            String fileName,
            String mimeType,
            UUID tenantId,
            List<String> codes,
            long startedNanos,
            String path) {
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
            lastDiagnostics = new BordereauExtractionDiagnostics(
                    strategy, path, 0, 0, 0, 0, 0,
                    List.of(firstIssue(response)), 0, 0, 0, response.costUsd());
            throw new IllegalStateException("BORDEREAU_EXTRACTION_FAILED: " + firstIssue(response));
        }
        ImportTreeRequest tree = mapToTree(response.data());
        normalizeUnites(tree, codes);
        int articles = countArticles(tree.getArbre());
        if (articles == 0) {
            lastDiagnostics = new BordereauExtractionDiagnostics(
                    strategy, path, 0, 0, 0, 0, 0,
                    List.of("zero_articles"), 0, 0, 0, response.costUsd());
            throw new IllegalStateException(
                    "BORDEREAU_EXTRACTION_FAILED: ZERO_ARTICLES — aucun article exploitable extrait");
        }
        long elapsedMs = (System.nanoTime() - startedNanos) / 1_000_000L;
        lastDiagnostics = new BordereauExtractionDiagnostics(
                strategy, path, articles > 0 ? 0.5 : 0, 0, 0, articles, articles,
                List.of(), 0, elapsedMs, 0, response.costUsd());
        log.info(
                "Bordereau extraction finished in {} ms (mode={}, path={}, file={}, outcome={}, lots={}, articles={})",
                elapsedMs,
                strategy,
                path,
                fileName,
                response.outcome(),
                tree.getArbre() != null ? tree.getArbre().size() : 0,
                articles);
        return tree;
    }

    private ImportTreeRequest extractLegacySilent(
            byte[] fileBytes,
            String fileName,
            String mimeType,
            UUID tenantId,
            List<String> codes) {
        StatelessExtractionResponse response = extractionService.process(
                fileBytes,
                fileName,
                mimeType,
                BORDEREAU_SCHEMA,
                null,
                buildInstructions(codes),
                tenantId != null ? tenantId.toString() : null,
                BORDEREAU_MAX_PROMPT_CHARS);
        if (response.outcome() == StatelessExtractionResponse.Outcome.REJECTED
                || response.outcome() == StatelessExtractionResponse.Outcome.TECHNICAL_FAILURE) {
            return new ImportTreeRequest();
        }
        ImportTreeRequest tree = mapToTree(response.data());
        normalizeUnites(tree, codes);
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

                IMPORTANT — lots racines :
                - Préfère un lot racine par « SOUS LOT N° X » / chapitre métier
                  (Terrassement, Charpente, Électricité, Fluides, etc.).
                - Ne crée JAMAIS un lot dont le libellé est le titre du marché
                  (ex. « TRAVAUX DE CONSTRUCTION… », « PLATEFORME AGRO… »,
                  « …RABAT-LOT-AMENAGEMENTS… »).
                """;
    }

    private static String chunkRepairInstructions(int startPage, int endPage) {
        return """
                Tu lis l'IMAGE des pages %d-%d d'un bordereau de prix BTP (tableau).
                Extrais TOUTES les lignes visibles : groups (LOT / SOUS_LOT / SECTION) et articles.
                Pour chaque article : code, libellé COMPLET (pas tronqué), unité, quantité, page.
                N'invente aucune valeur. Ignore PU, montants, totaux et en-têtes marché répétés.
                Le titre long du marché n'est PAS un lot.
                kind des groups : LOT | SOUS_LOT | SECTION.
                """.formatted(startPage, endPage);
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

                PRIORITÉ ABSOLUE — les postes (articles structurels) :
                - Extrais TOUTES les lignes de postes avec code, libellé, unité et quantité.
                - IGNORE les prix unitaires, montants HT et totaux : ils seront chiffrés plus tard.
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

    static int countArticles(List<ImportNoeudDto> noeuds) {
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

    private static int countOrphans(ImportTreeRequest tree) {
        if (tree == null || tree.getArbre() == null) {
            return 0;
        }
        int orphans = 0;
        for (ImportNoeudDto lot : tree.getArbre()) {
            if (lot != null && "A classer".equalsIgnoreCase(lot.getLibelle())) {
                orphans += countArticles(lot.getEnfants());
            }
        }
        return orphans;
    }

    private static boolean hasMarketTitleRoot(ImportTreeRequest tree) {
        if (tree == null || tree.getArbre() == null) {
            return false;
        }
        for (ImportNoeudDto root : tree.getArbre()) {
            if (root != null && PdfBordereauLayoutParser.isMarketTitleNoise(root.getLibelle())) {
                return true;
            }
        }
        return false;
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

    private record SetWeakRepair(
            List<BordereauRowCandidate> extras, int repairedChunks, long repairMs, long classifyMs) {
        static SetWeakRepair empty() {
            return new SetWeakRepair(List.of(), 0, 0, 0);
        }
    }
}
