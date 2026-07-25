package ma.nafura.etudes.service.bordereau;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;

class BordereauQualityReportTest {

    @Test
    void evaluate_zeroArticles_notAcceptable() {
        BordereauParseResult parse = new BordereauParseResult(
                1, 100,
                List.of(new BordereauRowCandidate(
                        "g0", 1, 0, "1", "TITRE MARCHE", null, null,
                        BordereauRowCandidate.Kind.LOT, 0.5, "titre")),
                Set.of(), BordereauParseResult.Quality.USABLE, null);

        BordereauQualityReport report = BordereauQualityReport.evaluate(parse, 0);
        assertThat(report.hasZeroArticles()).isTrue();
        assertThat(report.acceptable()).isFalse();
        assertThat(report.warnings()).contains("zero_articles");
    }

    @Test
    void evaluate_pricedArticles_highConfidence() {
        List<BordereauRowCandidate> rows = new ArrayList<>();
        rows.add(new BordereauRowCandidate(
                "g0", 1, 0, "1", "SOUS LOT 1", null, null,
                BordereauRowCandidate.Kind.SOUS_LOT, 0.9, "g"));
        for (int i = 0; i < 25; i++) {
            rows.add(new BordereauRowCandidate(
                    "r" + i, 1, i + 1, "1-1-" + i, "ART " + i, "M3", new BigDecimal("10"),
                    BordereauRowCandidate.Kind.ARTICLE, 0.95, "r" + i));
        }
        BordereauParseResult parse = new BordereauParseResult(
                1, 500, rows, Set.of(1), BordereauParseResult.Quality.USABLE, null);

        BordereauQualityReport report = BordereauQualityReport.evaluate(parse, 0);
        assertThat(report.articleCount()).isEqualTo(25);
        assertThat(report.acceptable()).isTrue();
        assertThat(report.highConfidence()).isTrue();
        assertThat(report.weakPages()).isEmpty();
    }

    @Test
    void detectWeakPages_flagsLowPricedRatio() {
        List<BordereauRowCandidate> rows = List.of(
                new BordereauRowCandidate(
                        "r0", 1, 0, "1-1-1", "A", null, null,
                        BordereauRowCandidate.Kind.ARTICLE, 0.4, "r0"),
                new BordereauRowCandidate(
                        "r1", 1, 1, "1-1-2", "B", null, null,
                        BordereauRowCandidate.Kind.ARTICLE, 0.4, "r1"),
                new BordereauRowCandidate(
                        "r2", 1, 2, "1-1-3", "C", "M3", new BigDecimal("1"),
                        BordereauRowCandidate.Kind.ARTICLE, 0.4, "r2"));
        BordereauParseResult parse = new BordereauParseResult(
                1, 100, rows, Set.of(1), BordereauParseResult.Quality.USABLE, null);

        assertThat(BordereauQualityReport.detectWeakPages(parse)).contains(1);
    }
}
