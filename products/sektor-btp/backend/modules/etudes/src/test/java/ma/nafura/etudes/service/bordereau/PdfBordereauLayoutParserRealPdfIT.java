package ma.nafura.etudes.service.bordereau;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import ma.nafura.etudes.api.request.ImportTreeRequest;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Optional local benchmark against {@code BDP-2-17.pdf}. Skipped when the file is absent
 * so CI stays green without shipping the document into Git.
 */
class PdfBordereauLayoutParserRealPdfIT {

    private static final Logger log = LoggerFactory.getLogger(PdfBordereauLayoutParserRealPdfIT.class);

    private static final Path REAL_PDF = Path.of(
            System.getProperty(
                    "nafura.bdp.sample",
                    "C:/Users/yassiveco/Desktop/zenit/BDP-2-17.pdf"));

    @Test
    void parse_realBdp_coversPagesAndArticlesQuickly() throws Exception {
        assumeTrue(Files.isRegularFile(REAL_PDF), "Real BDP sample not present: " + REAL_PDF);

        byte[] bytes = Files.readAllBytes(REAL_PDF);
        PdfBordereauLayoutParser parser = new PdfBordereauLayoutParser();
        BordereauHybridAssembler assembler = new BordereauHybridAssembler();

        long t0 = System.nanoTime();
        BordereauParseResult parse = parser.parse(bytes);
        long parseMs = (System.nanoTime() - t0) / 1_000_000L;

        ImportTreeRequest localTree = assembler.assembleLocalOnly(parse);
        long totalMs = (System.nanoTime() - t0) / 1_000_000L;

        List<BordereauRowCandidate> articles = parse.articleCandidates();
        long priced = articles.stream().filter(BordereauRowCandidate::hasPricing).count();

        log.info(
                "REAL BDP benchmark: parseMs={}, totalMs={}, quality={}, pages={}/{}, "
                        + "articles={}, priced={}, groups={}, reject={}",
                parseMs,
                totalMs,
                parse.quality(),
                parse.pagesWithCandidates().size(),
                parse.pageCount(),
                articles.size(),
                priced,
                parse.groupingCandidates().size(),
                parse.rejectReason());

        assertThat(parse.usableForHybrid()).isTrue();
        assertThat(parseMs).isLessThan(5_000L);
        assertThat(articles.size()).isGreaterThanOrEqualTo(100);
        assertThat(priced).isGreaterThanOrEqualTo(80);
        assertThat(parse.pagesWithCandidates().size()).isGreaterThanOrEqualTo(10);
        assertThat(localTree.getArbre()).isNotEmpty();

        // Sample checkpoints: start / middle / end codes seen earlier in the document.
        assertThat(articles).anyMatch(a -> "1-1-1".equals(a.code()));
        assertThat(articles).anyMatch(a -> a.code() != null && a.code().startsWith("3."));
        assertThat(articles).anyMatch(a -> a.code() != null && a.code().startsWith("9."));
    }
}
