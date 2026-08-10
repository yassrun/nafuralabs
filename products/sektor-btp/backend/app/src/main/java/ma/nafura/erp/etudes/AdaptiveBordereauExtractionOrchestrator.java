package ma.nafura.erp.etudes;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
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
import ma.nafura.etudes.service.port.ExtractionProgress;
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
 * Pipeline adaptatif :
 * <ul>
 *   <li>Excel/CSV → parse tabulaire déterministe</li>
 *   <li>PDF → vision page/page (forceMedia), puis assemblage IA final</li>
 *   <li>fallback PDFBox / legacy si vision trop faible</li>
 * </ul>
 */
@Component
public class AdaptiveBordereauExtractionOrchestrator {

    private static final Logger log = LoggerFactory.getLogger(AdaptiveBordereauExtractionOrchestrator.class);

    private static final int BORDEREAU_MAX_PROMPT_CHARS = 60_000;
    private static final int HYBRID_MAX_PROMPT_CHARS = 80_000;
    /** Repair ciblé (pages faibles) : petits paquets. */
    private static final int CHUNK_MAX_PAGES = 3;
    /** Vision-first : 1 page = 1 appel (source de vérité visuelle / texte). */
    private static final int VISION_PAGES_PER_CHUNK = 1;
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
        return extract(fileBytes, fileName, mimeType, ExtractionProgress.noop());
    }

    public ImportTreeRequest extract(
            byte[] fileBytes, String fileName, String mimeType, ExtractionProgress progress) {
        ExtractionProgress prog = progress != null ? progress : ExtractionProgress.noop();
        UUID tenantId = TenantContext.getTenantIdOrNull();
        List<String> unitCodes = loadActiveUnitCodes(tenantId);
        long started = System.nanoTime();
        prog.report(3, "Préparation…");

        if ("legacy".equals(strategy)) {
            prog.report(20, "Extraction document…");
            return extractLegacy(fileBytes, fileName, mimeType, tenantId, unitCodes, started, "legacy");
        }

        if ("vision".equals(strategy) && isPdf(mimeType, fileName)) {
            return extractVisionThenAssemble(
                    fileBytes, fileName, mimeType, tenantId, unitCodes, started, "vision", prog);
        }

        ImportTreeRequest adaptive =
                extractAdaptive(fileBytes, fileName, mimeType, tenantId, unitCodes, started, prog);

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
            long startedNanos,
            ExtractionProgress progress) {

        if (tabularParser.supports(mimeType, fileName)) {
            progress.report(15, "Lecture tableur…");
            long parseStart = System.nanoTime();
            BordereauParseResult parse = tabularParser.parse(fileBytes, fileName, mimeType);
            long parseMs = (System.nanoTime() - parseStart) / 1_000_000L;
            progress.report(70, "Assemblage de l’arbre…");
            return finalizeFromParse(
                    parse,
                    fileName,
                    tenantId,
                    unitCodes,
                    parseMs,
                    0,
                    0,
                    0,
                    "table",
                    startedNanos,
                    false,
                    progress);
        }

        if (!isPdf(mimeType, fileName)) {
            progress.report(20, "Extraction document…");
            return extractLegacy(
                    fileBytes, fileName, mimeType, tenantId, unitCodes, startedNanos, "legacy-non-pdf");
        }

        // PDF : vision page/page → texte complet → assemblage IA (évite libellés PDFBox tronqués).
        return extractVisionThenAssemble(
                fileBytes,
                fileName,
                mimeType,
                tenantId,
                unitCodes,
                startedNanos,
                "adaptive-vision",
                progress);
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
            long startedNanos,
            boolean forceClassify,
            ExtractionProgress progress) {

        long classifyStart = System.nanoTime();
        ImportTreeRequest tree;
        long classifyMs = classifyBudgetMs;

        BordereauQualityReport pre = BordereauQualityReport.evaluate(parse, 0);
        long lotCount = parse.rows().stream()
                .filter(r -> r.kind() == BordereauRowCandidate.Kind.LOT)
                .count();
        long sousLotCount = parse.rows().stream()
                .filter(r -> r.kind() == BordereauRowCandidate.Kind.SOUS_LOT)
                .count();
        boolean tabular = path != null && path.startsWith("table");
        // Tableur : les quantités manquantes sont souvent un manque source (Villa ~40 %),
        // pas un échec de lecture. Si la grille a déjà posé des LOT, on reste local —
        // sinon l'IA invente des libellés vides → fallback UI « Lot » / « Sous-lot ».
        boolean localHierarchyOk = !parse.groupingCandidates().isEmpty()
                && pre.articleCount() >= 3
                && pre.weakPages().isEmpty()
                && (tabular
                        ? (lotCount >= 2 || sousLotCount >= 2 || pre.pricedRatio() >= 0.45)
                        : pre.pricedRatio() >= 0.8);
        // Clear "SOUS LOT N° X" chapters → prefer local promotion to root lots (no LLM invent).
        if (sousLotCount >= 2 && pre.pricedRatio() >= 0.7 && pre.articleCount() >= 10) {
            localHierarchyOk = true;
        }
        if (tabular && lotCount >= 2 && pre.articleCount() >= 10) {
            localHierarchyOk = true;
        }
        if (!forceClassify && (pre.highConfidence() || localHierarchyOk)) {
            progress.report(Math.max(70, progressFloor(path)), "Assemblage local…");
            tree = hybridAssembler.assembleLocalOnly(parse);
            classifyMs = 0;
            path = path + "+local-hierarchy";
        } else {
            progress.report(Math.max(88, progressFloor(path)), "Assemblage IA…");
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
                    if (hasMarketTitleRoot(tree) || hasGenericLotLabels(tree)) {
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

        progress.report(95, "Normalisation…");
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
        progress.report(98, "Finalisation…");
        return tree;
    }

    private static double truncatedLibelleRatio(BordereauParseResult parse) {
        var articles = parse.articleCandidates();
        if (articles.isEmpty()) {
            return 1.0;
        }
        long truncated = articles.stream()
                .filter(a -> BordereauRowCandidate.looksTruncated(a.libelle()))
                .count();
        return truncated / (double) articles.size();
    }

    private static int progressFloor(String path) {
        return path != null && path.contains("vision") ? 88 : 70;
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
        return runChunkRepairs(chunks, fileName, tenantId, false, ExtractionProgress.noop(), 0, 0);
    }

    /**
     * Vision page/page → candidats texte complets → assemblage IA final.
     * Ne réutilise pas les libellés PDFBox (souvent tronqués) comme source article.
     */
    private ImportTreeRequest extractVisionThenAssemble(
            byte[] fileBytes,
            String fileName,
            String mimeType,
            UUID tenantId,
            List<String> unitCodes,
            long startedNanos,
            String pathPrefix,
            ExtractionProgress progress) {

        progress.report(5, "Analyse du PDF…");
        long parseStart = System.nanoTime();
        BordereauParseResult layoutHint = layoutParser.parse(fileBytes, progress);
        long parseMs = (System.nanoTime() - parseStart) / 1_000_000L;

        int pages = Math.max(layoutHint.pageCount(), 1);
        List<Integer> allPages = new ArrayList<>(pages);
        for (int p = 1; p <= pages; p++) {
            allPages.add(p);
        }
        List<PdfPageChunker.PageChunk> chunks =
                pageChunker.chunksForPages(fileBytes, allPages, VISION_PAGES_PER_CHUNK);
        log.info(
                "Bordereau vision-then-assemble starting (file={}, pages={}, chunks={}, path={})",
                fileName,
                pages,
                chunks.size(),
                pathPrefix);

        // Après fix géométrie : si les libellés locaux sont complets, pas besoin de 16 appels LLM.
        if (layoutHint.usableForHybrid() && truncatedLibelleRatio(layoutHint) < 0.12) {
            log.info(
                    "Bordereau local text layer trusted (file={}, articles={}, truncRatio={})",
                    fileName,
                    layoutHint.articleCandidates().size(),
                    String.format(Locale.ROOT, "%.2f", truncatedLibelleRatio(layoutHint)));
            progress.report(40, "Parse local fiable…");
            return finalizeFromParse(
                    layoutHint,
                    fileName,
                    tenantId,
                    unitCodes,
                    parseMs,
                    0,
                    0,
                    0,
                    pathPrefix + "+local-trusted",
                    startedNanos,
                    false,
                    progress);
        }

        if (chunks.isEmpty()) {
            log.warn("Bordereau vision chunks empty (file={}) — fallback local/legacy", fileName);
            if (layoutHint.usableForHybrid()) {
                progress.report(40, "Fallback parse local…");
                return finalizeFromParse(
                        layoutHint,
                        fileName,
                        tenantId,
                        unitCodes,
                        parseMs,
                        0,
                        0,
                        0,
                        pathPrefix + "+fallback-local-empty-chunks",
                        startedNanos,
                        false,
                        progress);
            }
            progress.report(40, "Fallback document…");
            return extractLegacy(
                    fileBytes,
                    fileName,
                    mimeType,
                    tenantId,
                    unitCodes,
                    startedNanos,
                    pathPrefix + "+fallback-legacy-empty-chunks");
        }

        // PDF à couche texte (BDP-2-17 typique) : texte page/page → LLM (DeepSeek text-only).
        // forceMedia=true seulement si couche texte absente/insuffisante (scan).
        boolean forceMedia = !layoutHint.usableForHybrid()
                || layoutHint.quality() == BordereauParseResult.Quality.INSUFFICIENT;
        progress.report(
                8,
                forceMedia
                        ? "Vision page 0 / " + pages
                        : "Lecture texte page 0 / " + pages);
        SetWeakRepair vision = runChunkRepairs(
                chunks, fileName, tenantId, forceMedia, progress, 10, 75);
        long visionArticles = vision.extras().stream()
                .filter(BordereauRowCandidate::looksLikeArticle)
                .count();

        if (visionArticles < VISION_MIN_ARTICLES_TO_TRUST) {
            log.warn(
                    "Bordereau vision-then-assemble weak (file={}, visionArticles={}) — falling back",
                    fileName,
                    visionArticles);
            if (layoutHint.usableForHybrid()) {
                BordereauParseResult merged = vision.extras().isEmpty()
                        ? layoutHint
                        : candidateMerger.merge(layoutHint, vision.extras());
                progress.report(80, "Fallback parse local…");
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
                        startedNanos,
                        false,
                        progress);
            }
            progress.report(80, "Fallback document…");
            return extractLegacy(
                    fileBytes,
                    fileName,
                    mimeType,
                    tenantId,
                    unitCodes,
                    startedNanos,
                    pathPrefix + "+fallback-legacy");
        }

        // Vision = source de vérité pour articles + groups. PDFBox : titres LOT/SOUS_LOT
        // uniquement s'ils ne sont pas déjà fournis par la vision.
        List<BordereauRowCandidate> combined = new ArrayList<>(vision.extras());
        Set<String> visionGroupCodes = vision.extras().stream()
                .filter(r -> r.kind() == BordereauRowCandidate.Kind.LOT
                        || r.kind() == BordereauRowCandidate.Kind.SOUS_LOT
                        || r.kind() == BordereauRowCandidate.Kind.SECTION)
                .map(r -> r.code() == null ? "" : r.code().trim().toUpperCase(Locale.ROOT))
                .filter(c -> !c.isBlank())
                .collect(Collectors.toCollection(java.util.HashSet::new));
        boolean visionHasGroups = vision.extras().stream().anyMatch(r ->
                r.kind() == BordereauRowCandidate.Kind.LOT
                        || r.kind() == BordereauRowCandidate.Kind.SOUS_LOT
                        || r.kind() == BordereauRowCandidate.Kind.SECTION);
        if (!visionHasGroups || visionGroupCodes.isEmpty()) {
            for (BordereauRowCandidate row : layoutHint.rows()) {
                if (row.kind() == BordereauRowCandidate.Kind.LOT
                        || row.kind() == BordereauRowCandidate.Kind.SOUS_LOT
                        || row.kind() == BordereauRowCandidate.Kind.SECTION) {
                    combined.add(row);
                }
            }
        } else {
            for (BordereauRowCandidate row : layoutHint.rows()) {
                if (row.kind() != BordereauRowCandidate.Kind.LOT
                        && row.kind() != BordereauRowCandidate.Kind.SOUS_LOT
                        && row.kind() != BordereauRowCandidate.Kind.SECTION) {
                    continue;
                }
                String code = row.code() == null ? "" : row.code().trim().toUpperCase(Locale.ROOT);
                if (!code.isBlank() && !visionGroupCodes.contains(code)) {
                    combined.add(row);
                }
            }
        }

        BordereauParseResult seeded = layoutHint.withRows(combined);
        BordereauParseResult merged = candidateMerger.dedupe(seeded);
        progress.report(88, "Assemblage IA…");
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
                startedNanos,
                true,
                progress);
    }

    private SetWeakRepair runChunkRepairs(
            List<PdfPageChunker.PageChunk> chunks,
            String fileName,
            UUID tenantId,
            boolean forceMedia,
            ExtractionProgress progress,
            int progressBase,
            int progressSpan) {
        long repairStart = System.nanoTime();
        int total = Math.max(chunks.size(), 1);
        List<BordereauRowCandidate> extras = new ArrayList<>();
        int repaired = 0;
        // Séquentiel : DeepSeek text-only + progress UI page/page fiable (évite file d'attente opaque).
        for (int i = 0; i < chunks.size(); i++) {
            PdfPageChunker.PageChunk chunk = chunks.get(i);
            int pageNo = i + 1;
            progress.report(
                    progressBase + (i * progressSpan) / total,
                    (forceMedia ? "Vision page " : "Lecture texte page ")
                            + pageNo
                            + " / "
                            + total
                            + "…");
            try {
                List<BordereauRowCandidate> part = repairChunk(chunk, fileName, tenantId, forceMedia);
                if (part != null && !part.isEmpty()) {
                    extras.addAll(part);
                    repaired++;
                }
            } catch (Exception ex) {
                log.warn("Bordereau chunk repair failed page {}: {}", pageNo, ex.getMessage());
            }
            progress.report(
                    progressBase + (pageNo * progressSpan) / total,
                    (forceMedia ? "Vision page " : "Lecture texte page ")
                            + pageNo
                            + " / "
                            + total);
        }
        long repairMs = (System.nanoTime() - repairStart) / 1_000_000L;
        return new SetWeakRepair(extras, repaired, repairMs, 0);
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
                Tu lis le TEXTE des pages %d-%d d'un bordereau de prix BTP (tableau).
                Extrais TOUTES les lignes : groups (LOT / SOUS_LOT / SECTION) et articles.
                Pour chaque article : code, libellé COMPLET depuis le DÉBUT de la cellule
                (ex. « FOUILLES EN PUITS ET EN TRANCHEES… », jamais un fragment
                « TRANCHEERS… » / « PUBLIQUES… » / « POUR TOUS OUVRAGES »), unité, quantité, page.
                Conserve les multi-lignes de désignation en un seul libellé.
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

    /**
     * L'IA a parfois renvoyé la hiérarchie sans libellés → fallback mapper « Lot » / « Sous-lot ».
     * Dans ce cas on préfère l'arbre local (libellés grille).
     */
    private static boolean hasGenericLotLabels(ImportTreeRequest tree) {
        if (tree == null || tree.getArbre() == null || tree.getArbre().isEmpty()) {
            return false;
        }
        int generic = 0;
        int groups = 0;
        for (ImportNoeudDto root : tree.getArbre()) {
            if (root == null) {
                continue;
            }
            groups++;
            if (isGenericGroupLabel(root.getLibelle())) {
                generic++;
            }
            if (root.getEnfants() != null) {
                for (ImportNoeudDto child : root.getEnfants()) {
                    if (child == null || DpgfNoeud.TYPE_ARTICLE.equalsIgnoreCase(child.getType())) {
                        continue;
                    }
                    groups++;
                    if (isGenericGroupLabel(child.getLibelle())) {
                        generic++;
                    }
                }
            }
        }
        return groups > 0 && generic * 2 >= groups;
    }

    private static boolean isGenericGroupLabel(String libelle) {
        if (libelle == null || libelle.isBlank()) {
            return true;
        }
        String t = libelle.trim();
        return t.equalsIgnoreCase("Lot")
                || t.equalsIgnoreCase("Sous-lot")
                || t.equalsIgnoreCase("Sous lot")
                || t.equalsIgnoreCase("LOT")
                || t.equalsIgnoreCase("SOUS_LOT");
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
        poste.setOrigineCout(ma.nafura.etudes.domain.OrigineCout.ESTIME.name());
        poste.setCoutDeduit(false);
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
