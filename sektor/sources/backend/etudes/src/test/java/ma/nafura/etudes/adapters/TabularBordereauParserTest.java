package ma.nafura.etudes.adapters;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import ma.nafura.etudes.service.bordereau.BordereauParseResult;
import ma.nafura.etudes.service.bordereau.BordereauRowCandidate;
import org.junit.jupiter.api.Test;

class TabularBordereauParserTest {

    private final TabularBordereauParser parser = new TabularBordereauParser();

    @Test
    void parse_csv_extractsArticlesAndGroups() {
        String csv = """
                Spreadsheet file: bdp.csv

                SOUS LOT N 1 TERRASSEMENT
                1-1-1\tFOUILLES EN PUITS\tM3\t10,00
                1-1-2\tREMBLAI\tM3\t5,00
                1-1-3\tBETON ARME\tM3\t70,00
                """;
        BordereauParseResult parse = parser.parse(
                csv.getBytes(StandardCharsets.UTF_8), "bdp.csv", "text/csv");

        assertThat(parse.usableForHybrid()).isTrue();
        assertThat(parse.articleCandidates()).hasSizeGreaterThanOrEqualTo(3);
        assertThat(parse.articleCandidates())
                .allMatch(a -> a.method() == BordereauRowCandidate.ExtractionMethod.TABLE);
        assertThat(parse.groupingCandidates()).isNotEmpty();
        assertThat(parse.articleCandidates())
                .anySatisfy(a -> {
                    assertThat(a.code()).isEqualTo("1-1-1");
                    assertThat(a.unite()).isEqualTo("M3");
                    assertThat(a.quantite()).isEqualByComparingTo("10");
                });
    }

    @Test
    void supports_xlsxAndCsv() {
        assertThat(parser.supports("text/csv", "a.csv")).isTrue();
        assertThat(parser.supports(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "a.xlsx")).isTrue();
        assertThat(parser.supports("application/pdf", "a.pdf")).isFalse();
    }
}
