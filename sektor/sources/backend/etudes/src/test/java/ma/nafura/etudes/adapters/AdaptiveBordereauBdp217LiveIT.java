package ma.nafura.etudes.adapters;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.file.Files;
import java.nio.file.Path;
import ma.nafura.etudes.api.request.ImportTreeRequest;
import ma.nafura.etudes.service.bordereau.BordereauCandidateMerger;
import ma.nafura.etudes.service.bordereau.BordereauHybridAssembler;
import ma.nafura.etudes.service.bordereau.PdfBordereauLayoutParser;
import ma.nafura.etudes.service.bordereau.PdfPageChunker;
import ma.nafura.catalogue.api.CatalogLookupApi;
import ma.nafura.platform.documents.docextractor.service.StatelessExtractionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Live check against {@code C:/Users/yassiveco/Desktop/zenit/BDP-2-17.pdf}.
 * Skipped when the file is absent.
 */
@ExtendWith(MockitoExtension.class)
class AdaptiveBordereauBdp217LiveIT {

    private static final Path SAMPLE = Path.of("C:/Users/yassiveco/Desktop/zenit/BDP-2-17.pdf");

    @Mock
    private StatelessExtractionService extractionService;

    @Mock
    private CatalogLookupApi catalogLookupApi;

    @Mock
    private TabularBordereauParser tabularParser;

    private AdaptiveBordereauExtractionOrchestrator orchestrator;

    @BeforeEach
    void setUp() {
        orchestrator = new AdaptiveBordereauExtractionOrchestrator(
                extractionService,
                catalogLookupApi,
                new PdfBordereauLayoutParser(),
                new BordereauHybridAssembler(),
                new BordereauCandidateMerger(),
                new PdfPageChunker(),
                tabularParser,
                "adaptive");
    }

    @Test
    void extract_bdp217_article111_hasFouilles() throws Exception {
        assumeTrue(Files.isRegularFile(SAMPLE), "BDP-2-17.pdf absent");
        when(tabularParser.supports(any(), any())).thenReturn(false);

        byte[] pdf = Files.readAllBytes(SAMPLE);
        ImportTreeRequest tree = orchestrator.extract(pdf, "BDP-2-17.pdf", "application/pdf");

        assertThat(AdaptiveBordereauExtractionOrchestrator.countArticles(tree.getArbre()))
                .isGreaterThanOrEqualTo(140);
        String flat = flatten(tree);
        assertThat(flat.toUpperCase()).contains("FOUILLES EN PUITS");
        assertThat(flat.toUpperCase()).contains("EVACUATION");
        assertThat(orchestrator.consumeDiagnostics().path()).contains("local-trusted");

        // Trusted local path must not call DeepSeek page/page.
        verify(extractionService, never()).process(
                any(), anyString(), anyString(), anyString(), isNull(),
                anyString(), any(), anyInt());
        verify(extractionService, never()).process(
                any(), anyString(), anyString(), anyString(), isNull(),
                anyString(), any(), anyInt(), anyBoolean());
    }

    private static String flatten(ImportTreeRequest tree) {
        StringBuilder sb = new StringBuilder();
        flatten(tree.getArbre(), sb);
        return sb.toString();
    }

    private static void flatten(
            java.util.List<ma.nafura.etudes.api.request.ImportNoeudDto> nodes, StringBuilder sb) {
        if (nodes == null) {
            return;
        }
        for (var n : nodes) {
            if (n.getLibelle() != null) {
                sb.append(' ').append(n.getLibelle());
            }
            flatten(n.getEnfants(), sb);
        }
    }
}
