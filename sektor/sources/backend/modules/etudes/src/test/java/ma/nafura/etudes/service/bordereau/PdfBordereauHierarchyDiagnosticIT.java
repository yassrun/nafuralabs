package ma.nafura.etudes.service.bordereau;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import ma.nafura.etudes.api.request.ImportNoeudDto;
import ma.nafura.etudes.api.request.ImportTreeRequest;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Diagnostic local against {@code BDP-2-17.pdf}: dumps groups, root lots and timings.
 */
class PdfBordereauHierarchyDiagnosticIT {

    private static final Logger log = LoggerFactory.getLogger(PdfBordereauHierarchyDiagnosticIT.class);

    private static final Path REAL_PDF = Path.of(
            System.getProperty(
                    "nafura.bdp.sample",
                    "C:/Users/yassiveco/Desktop/zenit/BDP-2-17.pdf"));

    @Test
    void diagnose_rootLotsAndGrouping() throws Exception {
        assumeTrue(Files.isRegularFile(REAL_PDF), "Real BDP sample not present: " + REAL_PDF);

        byte[] bytes = Files.readAllBytes(REAL_PDF);
        PdfBordereauLayoutParser parser = new PdfBordereauLayoutParser();
        BordereauHybridAssembler assembler = new BordereauHybridAssembler();

        long t0 = System.nanoTime();
        BordereauParseResult parse = parser.parse(bytes);
        long parseMs = (System.nanoTime() - t0) / 1_000_000L;

        long t1 = System.nanoTime();
        ImportTreeRequest local = assembler.assembleLocalOnly(parse);
        long assembleMs = (System.nanoTime() - t1) / 1_000_000L;

        List<BordereauRowCandidate> lots = parse.rows().stream()
                .filter(r -> r.kind() == BordereauRowCandidate.Kind.LOT)
                .toList();
        List<BordereauRowCandidate> sousLots = parse.rows().stream()
                .filter(r -> r.kind() == BordereauRowCandidate.Kind.SOUS_LOT)
                .toList();

        log.info("=== DIAG PARSE {} ms | articles={} priced={} lots={} sousLots={} ===",
                parseMs,
                parse.articleCandidates().size(),
                parse.articleCandidates().stream().filter(BordereauRowCandidate::hasPricing).count(),
                lots.size(),
                sousLots.size());

        for (BordereauRowCandidate sl : sousLots) {
            log.info("SOUS_LOT page={} code={} | {}", sl.page(), sl.code(), truncate(sl.libelle(), 100));
        }

        log.info("=== LOCAL TREE assemble={} ms | rootLots={} articles={} ===",
                assembleMs,
                local.getArbre().size(),
                countArticles(local.getArbre()));
        for (ImportNoeudDto root : local.getArbre()) {
            log.info("ROOT type={} code={} enfants={} articles={} | {}",
                    root.getType(),
                    root.getCode(),
                    root.getEnfants() == null ? 0 : root.getEnfants().size(),
                    countArticles(root.getEnfants()),
                    truncate(root.getLibelle(), 120));
        }

        assertThat(parse.usableForHybrid()).isTrue();
        assertThat(parseMs).isLessThan(5_000L);
        assertThat(parse.articleCandidates().size()).isGreaterThanOrEqualTo(100);
        assertThat(local.getArbre().size()).isGreaterThanOrEqualTo(5);
        assertThat(local.getArbre())
                .noneMatch(n -> PdfBordereauLayoutParser.isMarketTitleNoise(n.getLibelle()));
        assertThat(local.getArbre().stream().map(ImportNoeudDto::getCode).toList())
                .contains("1", "2");
        assertThat(countArticles(local.getArbre())).isGreaterThanOrEqualTo(100);
    }

    private static int countArticles(List<ImportNoeudDto> noeuds) {
        if (noeuds == null) {
            return 0;
        }
        int n = 0;
        for (ImportNoeudDto noeud : noeuds) {
            if (DpgfNoeud.TYPE_ARTICLE.equalsIgnoreCase(noeud.getType())) {
                n++;
            }
            n += countArticles(noeud.getEnfants());
        }
        return n;
    }

    private static String truncate(String s, int max) {
        if (s == null) {
            return "";
        }
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }
}
