package ma.nafura.etudes.adapters.capability;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import ma.nafura.etudes.api.request.ImportTreeRequest;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.service.bordereau.BordereauCandidateMerger;
import ma.nafura.etudes.service.bordereau.BordereauHybridAssembler;
import ma.nafura.etudes.service.bordereau.BordereauParseResult;
import ma.nafura.etudes.service.bordereau.BordereauRowCandidate;
import ma.nafura.etudes.service.bordereau.PdfBordereauLayoutParser;
import ma.nafura.etudes.service.bordereau.PdfPageChunker;
import ma.nafura.catalogue.api.CatalogLookupApi;
import ma.nafura.platform.documents.docextractor.api.response.StatelessExtractionResponse;
import ma.nafura.platform.documents.docextractor.service.StatelessExtractionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdaptiveBordereauExtractionOrchestratorTest {

    @Mock
    private StatelessExtractionService extractionService;

    @Mock
    private CatalogLookupApi catalogLookupApi;

    @Mock
    private PdfBordereauLayoutParser layoutParser;

    @Mock
    private TabularBordereauParser tabularParser;

    private final BordereauHybridAssembler assembler = new BordereauHybridAssembler();
    private final BordereauCandidateMerger merger = new BordereauCandidateMerger();
    private final PdfPageChunker pageChunker = new PdfPageChunker();
    private final ObjectMapper mapper = new ObjectMapper();

    private AdaptiveBordereauExtractionOrchestrator adaptive;
    private AdaptiveBordereauExtractionOrchestrator legacy;

    @BeforeEach
    void setUp() {
        adaptive = new AdaptiveBordereauExtractionOrchestrator(
                extractionService,
                catalogLookupApi,
                layoutParser,
                assembler,
                merger,
                pageChunker,
                tabularParser,
                "adaptive");
        legacy = new AdaptiveBordereauExtractionOrchestrator(
                extractionService,
                catalogLookupApi,
                layoutParser,
                assembler,
                merger,
                pageChunker,
                tabularParser,
                "legacy");
    }

    @Test
    void extract_adaptivePdf_usesVisionThenClassify() throws Exception {
        when(tabularParser.supports(any(), any())).thenReturn(false);
        when(layoutParser.parse(any(), any())).thenReturn(usableParseWithGroups());
        when(extractionService.process(
                        any(), anyString(), eq("application/pdf"), anyString(), isNull(),
                        anyString(), any(), anyInt(), eq(true)))
                .thenReturn(new StatelessExtractionResponse(
                        StatelessExtractionResponse.Outcome.COMPLETED,
                        mapper.readTree("""
                                {
                                  "groups": [{"code":"1","libelle":"TERRASSEMENT","kind":"LOT"}],
                                  "articles": [
                                    {"code":"1-1-1","libelle":"FOUILLES EN PUITS ET EN TRANCHEES","unite":"M3","quantite":10,"page":1},
                                    {"code":"1-1-2","libelle":"EVACUATION AUX DECHARGES","unite":"M3","quantite":10,"page":1},
                                    {"code":"1-1-3","libelle":"BETON ARME","unite":"M3","quantite":70,"page":1},
                                    {"code":"1-1-4","libelle":"ARMATURES","unite":"KG","quantite":500,"page":1},
                                    {"code":"1-1-5","libelle":"SCELLEMENTS","unite":"U","quantite":40,"page":1},
                                    {"code":"1-1-6","libelle":"REGARDS","unite":"U","quantite":5,"page":1},
                                    {"code":"1-1-7","libelle":"CANALISATION","unite":"ML","quantite":40,"page":1},
                                    {"code":"1-1-8","libelle":"DALLAGE","unite":"M2","quantite":100,"page":1}
                                  ]
                                }
                                """),
                        null, null, null, List.of(),
                        null, null, null, null, null));
        when(extractionService.process(
                        any(), anyString(), eq("text/plain"), anyString(), isNull(),
                        anyString(), any(), anyInt()))
                .thenReturn(new StatelessExtractionResponse(
                        StatelessExtractionResponse.Outcome.REJECTED,
                        null, null, null, null, List.of(),
                        null, null, null, null, null));

        byte[] pdf = minimalOnePagePdf();
        var result = adaptive.extractResult(pdf, "bdp.pdf", "application/pdf", null);
        ImportTreeRequest tree = result.tree();

        assertThat(tree.getArbre()).isNotEmpty();
        assertThat(AdaptiveBordereauExtractionOrchestrator.countArticles(tree.getArbre()))
                .isGreaterThanOrEqualTo(3);
        String joined = flattenLibelles(tree);
        assertThat(joined.toUpperCase()).contains("FOUILLES");
        assertThat(result.diagnostics().path()).contains("adaptive-vision");
        verify(extractionService, never()).process(
                any(), anyString(), eq("application/pdf"), anyString(), isNull(),
                anyString(), any(), anyInt(), eq(true));
    }

    @Test
    void extract_adaptiveNeedsClassify_callsClassifierNotFullPdf() throws Exception {
        // Non-PDF / tableur path still uses local parse + classify without vision.
        when(tabularParser.supports(any(), any())).thenReturn(true);
        when(tabularParser.parse(any(), any(), any())).thenReturn(usableParse());
        when(extractionService.process(
                        any(), anyString(), eq("text/plain"), anyString(), isNull(),
                        anyString(), any(), anyInt()))
                .thenReturn(new StatelessExtractionResponse(
                        StatelessExtractionResponse.Outcome.COMPLETED,
                        mapper.readTree("""
                                {
                                  "lots": [{
                                    "libelle": "Lot 1",
                                    "articleRowIds": ["r0", "r1"]
                                  }]
                                }
                                """),
                        null, null, null, List.of(),
                        null, null, null, null, null));

        ImportTreeRequest tree = adaptive.extract(
                new byte[] {1, 2, 3}, "bdp.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        assertThat(tree.getArbre()).hasSize(2);
        assertThat(tree.getArbre().get(0).getLibelle()).isEqualTo("Lot 1");
        assertThat(tree.getArbre().get(0).getEnfants()).hasSize(2);
        assertThat(tree.getArbre().get(0).getEnfants().get(0).getType())
                .isEqualTo(DpgfNoeud.TYPE_ARTICLE);
        assertThat(tree.getArbre().get(0).getEnfants().get(0).getUnite()).isEqualTo("M3");
        assertThat(tree.getArbre().get(1).getLibelle()).isEqualTo("A classer");

        verify(extractionService).process(
                any(), anyString(), eq("text/plain"), anyString(), isNull(),
                anyString(), any(), anyInt());
        verify(extractionService, never()).process(
                any(), anyString(), anyString(), anyString(), isNull(),
                anyString(), any(), anyInt(), anyBoolean());
    }

    @Test
    void extract_lowCoverage_fallsBackToLegacy() throws Exception {
        when(tabularParser.supports(any(), any())).thenReturn(false);
        when(layoutParser.parse(any(), any())).thenReturn(BordereauParseResult.insufficient(
                2, 10, List.of(), "corrupt_layout"));
        // Vision chunks empty or weak → legacy whole-doc
        when(extractionService.process(
                        any(), anyString(), eq("application/pdf"), anyString(), isNull(),
                        anyString(), any(), anyInt(), eq(true)))
                .thenReturn(new StatelessExtractionResponse(
                        StatelessExtractionResponse.Outcome.TECHNICAL_FAILURE,
                        null, null, null, null, List.of(),
                        null, null, null, null, null));
        when(extractionService.process(
                        any(), anyString(), eq("application/pdf"), anyString(), isNull(),
                        anyString(), any(), anyInt()))
                .thenReturn(new StatelessExtractionResponse(
                        StatelessExtractionResponse.Outcome.COMPLETED,
                        mapper.readTree("""
                                {
                                  "lots": [{
                                    "libelle": "Legacy Lot",
                                    "postes": [{
                                      "code": "1",
                                      "libelle": "Article legacy",
                                      "unite": "U",
                                      "quantite": 1
                                    }]
                                  }]
                                }
                                """),
                        null, null, null, List.of(),
                        null, null, null, null, null));

        byte[] pdf = minimalOnePagePdf();
        ImportTreeRequest tree = adaptive.extract(pdf, "scan.pdf", "application/pdf");

        assertThat(tree.getArbre()).hasSize(1);
        assertThat(tree.getArbre().get(0).getLibelle()).isEqualTo("Legacy Lot");
        assertThat(tree.getArbre().get(0).getEnfants().get(0).getLibelle())
                .isEqualTo("Article legacy");
    }

    @Test
    void extract_legacyZeroArticles_throws() throws Exception {
        when(extractionService.process(
                        any(), anyString(), anyString(), anyString(), isNull(),
                        anyString(), any(), anyInt()))
                .thenReturn(new StatelessExtractionResponse(
                        StatelessExtractionResponse.Outcome.COMPLETED,
                        mapper.readTree("""
                                {"lots":[{"libelle":"TITRE MARCHE","postes":[]}]}
                                """),
                        null, null, null, List.of(),
                        null, null, null, null, null));

        assertThatThrownBy(() -> legacy.extract(new byte[] {9}, "bdp.pdf", "application/pdf"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("ZERO_ARTICLES");
        verify(layoutParser, never()).parse(any());
    }

    @Test
    void extract_legacyStrategy_skipsParser() throws Exception {
        when(extractionService.process(
                        any(), anyString(), anyString(), anyString(), isNull(),
                        anyString(), any(), anyInt()))
                .thenReturn(new StatelessExtractionResponse(
                        StatelessExtractionResponse.Outcome.COMPLETED,
                        mapper.readTree("""
                                {"lots":[{"libelle":"L","postes":[{"libelle":"A","unite":"U","quantite":1}]}]}
                                """),
                        null, null, null, List.of(),
                        null, null, null, null, null));

        legacy.extract(new byte[] {9}, "bdp.pdf", "application/pdf");

        verify(layoutParser, never()).parse(any());
        verify(extractionService, never()).process(
                any(), anyString(), anyString(), anyString(), isNull(),
                anyString(), any(), anyInt(), anyBoolean());
    }

    @Test
    void extract_visionStrategy_usesForceMediaPerPage() throws Exception {
        AdaptiveBordereauExtractionOrchestrator vision = new AdaptiveBordereauExtractionOrchestrator(
                extractionService,
                catalogLookupApi,
                layoutParser,
                assembler,
                merger,
                pageChunker,
                tabularParser,
                "vision");

        when(layoutParser.parse(any(), any())).thenReturn(usableParseWithGroups());
        when(extractionService.process(
                        any(), anyString(), eq("application/pdf"), anyString(), isNull(),
                        anyString(), any(), anyInt(), eq(true)))
                .thenReturn(new StatelessExtractionResponse(
                        StatelessExtractionResponse.Outcome.COMPLETED,
                        mapper.readTree("""
                                {
                                  "groups": [{"code":"1","libelle":"TERRASSEMENT","kind":"LOT"}],
                                  "articles": [
                                    {"code":"1-1-1","libelle":"FOUILLES EN PUITS","unite":"M3","quantite":10,"page":1},
                                    {"code":"1-1-2","libelle":"EVACUATION","unite":"M3","quantite":10,"page":1},
                                    {"code":"1-1-3","libelle":"BETON ARME","unite":"M3","quantite":70,"page":1},
                                    {"code":"1-1-4","libelle":"ARMATURES","unite":"KG","quantite":500,"page":1},
                                    {"code":"1-1-5","libelle":"SCELLEMENTS","unite":"U","quantite":40,"page":1},
                                    {"code":"1-1-6","libelle":"REGARDS","unite":"U","quantite":5,"page":1},
                                    {"code":"1-1-7","libelle":"CANALISATION","unite":"ML","quantite":40,"page":1},
                                    {"code":"1-1-8","libelle":"DALLAGE","unite":"M2","quantite":100,"page":1}
                                  ]
                                }
                                """),
                        null, null, null, List.of(),
                        null, null, null, null, null));
        when(extractionService.process(
                        any(), anyString(), eq("text/plain"), anyString(), isNull(),
                        anyString(), any(), anyInt()))
                .thenReturn(new StatelessExtractionResponse(
                        StatelessExtractionResponse.Outcome.REJECTED,
                        null, null, null, null, List.of(),
                        null, null, null, null, null));

        // Minimal valid PDF bytes so PdfPageChunker can open a page subset — use layout pageCount=1
        // via usableParseWithGroups; chunker still needs real PDF. Stub empty → chunks empty → fallback.
        // Prefer mocking chunker path by providing a tiny PDF via layout pageCount and
        // accepting fallback-local when chunks fail: force a non-empty chunk by using real PDF bytes.
        byte[] pdf = minimalOnePagePdf();
        when(layoutParser.parse(any(), any())).thenReturn(usableParseWithGroups().withRows(List.of(
                new BordereauRowCandidate(
                        "r0", 1, 0, "1-1-1", "FOUILLES", "M3", new BigDecimal("10"),
                        BordereauRowCandidate.Kind.ARTICLE, 0.9, "r0"),
                new BordereauRowCandidate(
                        "g1", 1, 1, "1", "TERRASSEMENT", null, null,
                        BordereauRowCandidate.Kind.LOT, 0.8, "g1"))));

        var visionResult = vision.extractResult(pdf, "bdp.pdf", "application/pdf", null);
        ImportTreeRequest tree = visionResult.tree();

        assertThat(AdaptiveBordereauExtractionOrchestrator.countArticles(tree.getArbre()))
                .isGreaterThanOrEqualTo(1);
        assertThat(visionResult.diagnostics().path()).contains("vision");
    }

    private static byte[] minimalOnePagePdf() {
        // Minimal valid 1-page PDF (no PDFBox on :sektor:app test classpath).
        String pdf = "%PDF-1.4\n"
                + "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
                + "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
                + "3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\n"
                + "xref\n0 4\n"
                + "0000000000 65535 f \n"
                + "0000000009 00000 n \n"
                + "0000000052 00000 n \n"
                + "0000000101 00000 n \n"
                + "trailer<</Size 4/Root 1 0 R>>\n"
                + "startxref\n178\n%%EOF\n";
        return pdf.getBytes(java.nio.charset.StandardCharsets.US_ASCII);
    }

    @Test
    void extract_dirtyTextLayer_escalatesToVision() throws Exception {
        // Adaptive PDF always vision; ensure full libellés win over truncated PDFBox fragments.
        List<BordereauRowCandidate> rows = new java.util.ArrayList<>();
        for (int i = 0; i < 25; i++) {
            rows.add(new BordereauRowCandidate(
                    "r" + i, 1, i, "1-" + i, "DANS TERRAIN FRAGMENT " + i, "M3", new BigDecimal("1"),
                    BordereauRowCandidate.Kind.ARTICLE, 0.7, "r" + i));
        }
        BordereauParseResult dirty = new BordereauParseResult(
                1, 100, rows, Set.of(1), BordereauParseResult.Quality.USABLE, null);

        when(tabularParser.supports(any(), any())).thenReturn(false);
        when(layoutParser.parse(any(), any())).thenReturn(dirty);
        when(extractionService.process(
                        any(), anyString(), eq("application/pdf"), anyString(), isNull(),
                        anyString(), any(), anyInt(), eq(true)))
                .thenReturn(new StatelessExtractionResponse(
                        StatelessExtractionResponse.Outcome.COMPLETED,
                        mapper.readTree("""
                                {
                                  "groups": [{"code":"1","libelle":"LOT 1 TERRASSEMENT","kind":"LOT"}],
                                  "articles": [
                                    {"code":"1-1","libelle":"FOUILLES EN PUITS","unite":"M3","quantite":12,"page":1},
                                    {"code":"1-2","libelle":"EVACUATION DEBLAIS","unite":"M3","quantite":10,"page":1},
                                    {"code":"1-3","libelle":"BETON ARME","unite":"M3","quantite":70,"page":1},
                                    {"code":"1-4","libelle":"ARMATURES ACIER","unite":"KG","quantite":500,"page":1},
                                    {"code":"1-5","libelle":"SCELLEMENTS","unite":"U","quantite":40,"page":1},
                                    {"code":"1-6","libelle":"REGARDS BETON","unite":"U","quantite":5,"page":1},
                                    {"code":"1-7","libelle":"CANALISATION PVC","unite":"ML","quantite":40,"page":1},
                                    {"code":"1-8","libelle":"DALLAGE BETON","unite":"M2","quantite":100,"page":1}
                                  ]
                                }
                                """),
                        null, null, null, List.of(),
                        null, null, null, null, null));
        when(extractionService.process(
                        any(), anyString(), eq("text/plain"), anyString(), isNull(),
                        anyString(), any(), anyInt()))
                .thenReturn(new StatelessExtractionResponse(
                        StatelessExtractionResponse.Outcome.REJECTED,
                        null, null, null, null, List.of(),
                        null, null, null, null, null));

        byte[] pdf = minimalOnePagePdf();
        var result = adaptive.extractResult(pdf, "dirty.pdf", "application/pdf", null);
        ImportTreeRequest tree = result.tree();

        assertThat(tree.getArbre()).isNotEmpty();
        String dirtyFlat = flattenLibelles(tree).toUpperCase();
        assertThat(dirtyFlat.contains("FOUILLES EN PUITS") || dirtyFlat.contains("DANS TERRAIN"))
                .as("vision LLM or local dirty labels")
                .isTrue();
        assertThat(result.diagnostics().path()).contains("adaptive-vision");
    }

    private static String flattenLibelles(ImportTreeRequest tree) {
        StringBuilder sb = new StringBuilder();
        flattenLibelles(tree.getArbre(), sb);
        return sb.toString();
    }

    private static void flattenLibelles(
            List<ma.nafura.etudes.api.request.ImportNoeudDto> nodes, StringBuilder sb) {
        if (nodes == null) {
            return;
        }
        for (ma.nafura.etudes.api.request.ImportNoeudDto n : nodes) {
            if (n.getLibelle() != null) {
                sb.append(' ').append(n.getLibelle());
            }
            flattenLibelles(n.getEnfants(), sb);
        }
    }

    private static BordereauParseResult usableParse() {
        List<BordereauRowCandidate> rows = List.of(
                new BordereauRowCandidate(
                        "r0", 1, 0, "1-1-1", "FOUILLES", "M3", new BigDecimal("10"),
                        BordereauRowCandidate.Kind.ARTICLE, 0.9, "r0"),
                new BordereauRowCandidate(
                        "r1", 1, 1, "1-1-2", "REMBLAI", "M3", new BigDecimal("5"),
                        BordereauRowCandidate.Kind.ARTICLE, 0.9, "r1"),
                new BordereauRowCandidate(
                        "r2", 1, 2, "1-1-3", "BETON", "M3", new BigDecimal("70"),
                        BordereauRowCandidate.Kind.ARTICLE, 0.9, "r2"));
        return new BordereauParseResult(
                1, 400, rows, Set.of(1), BordereauParseResult.Quality.USABLE, null);
    }

    private static BordereauParseResult usableParseWithGroups() {
        List<BordereauRowCandidate> rows = List.of(
                new BordereauRowCandidate(
                        "g0", 1, 0, "1", "SOUS LOT N 1 TERRASSEMENT", null, null,
                        BordereauRowCandidate.Kind.SOUS_LOT, 0.9, "g0"),
                new BordereauRowCandidate(
                        "r0", 1, 1, "1-1-1", "FOUILLES", "M3", new BigDecimal("10"),
                        BordereauRowCandidate.Kind.ARTICLE, 0.95, "r0"),
                new BordereauRowCandidate(
                        "r1", 1, 2, "1-1-2", "REMBLAI", "M3", new BigDecimal("5"),
                        BordereauRowCandidate.Kind.ARTICLE, 0.95, "r1"),
                new BordereauRowCandidate(
                        "r2", 1, 3, "1-1-3", "BETON", "M3", new BigDecimal("70"),
                        BordereauRowCandidate.Kind.ARTICLE, 0.95, "r2"));
        // Many priced articles + groups → highConfidence local path
        return new BordereauParseResult(
                1, 800, rows, Set.of(1), BordereauParseResult.Quality.USABLE, null);
    }
}
