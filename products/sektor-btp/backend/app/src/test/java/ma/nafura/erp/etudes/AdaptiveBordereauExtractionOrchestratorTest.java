package ma.nafura.erp.etudes;

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
import ma.nafura.etudes.domain.model.DpgfNoeud;
import ma.nafura.etudes.service.bordereau.BordereauCandidateMerger;
import ma.nafura.etudes.service.bordereau.BordereauHybridAssembler;
import ma.nafura.etudes.service.bordereau.BordereauParseResult;
import ma.nafura.etudes.service.bordereau.BordereauRowCandidate;
import ma.nafura.etudes.service.bordereau.PdfBordereauLayoutParser;
import ma.nafura.etudes.service.bordereau.PdfPageChunker;
import ma.nafura.item.repository.UnitOfMeasureRepository;
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
    private UnitOfMeasureRepository unitOfMeasureRepository;

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
                unitOfMeasureRepository,
                layoutParser,
                assembler,
                merger,
                pageChunker,
                tabularParser,
                "adaptive");
        legacy = new AdaptiveBordereauExtractionOrchestrator(
                extractionService,
                unitOfMeasureRepository,
                layoutParser,
                assembler,
                merger,
                pageChunker,
                tabularParser,
                "legacy");
    }

    @Test
    void extract_adaptiveHighConfidence_usesLocalHierarchyWithoutLlm() {
        when(tabularParser.supports(any(), any())).thenReturn(false);
        when(layoutParser.parse(any())).thenReturn(usableParseWithGroups());

        ImportTreeRequest tree = adaptive.extract(
                new byte[] {1, 2, 3}, "bdp.pdf", "application/pdf");

        assertThat(tree.getArbre()).isNotEmpty();
        assertThat(AdaptiveBordereauExtractionOrchestrator.countArticles(tree.getArbre()))
                .isEqualTo(3);
        verify(extractionService, never()).process(
                any(), anyString(), anyString(), anyString(), isNull(),
                anyString(), any(), anyInt());
        assertThat(adaptive.consumeDiagnostics().path()).contains("local-hierarchy");
    }

    @Test
    void extract_adaptiveNeedsClassify_callsClassifierNotFullPdf() throws Exception {
        when(tabularParser.supports(any(), any())).thenReturn(false);
        when(layoutParser.parse(any())).thenReturn(usableParse());
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
                new byte[] {1, 2, 3}, "bdp.pdf", "application/pdf");

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
    }

    @Test
    void extract_lowCoverage_fallsBackToLegacy() throws Exception {
        when(tabularParser.supports(any(), any())).thenReturn(false);
        when(layoutParser.parse(any())).thenReturn(BordereauParseResult.insufficient(
                2, 10, List.of(), "corrupt_layout"));
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

        ImportTreeRequest tree = adaptive.extract(
                new byte[] {1, 2, 3}, "scan.pdf", "application/pdf");

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
