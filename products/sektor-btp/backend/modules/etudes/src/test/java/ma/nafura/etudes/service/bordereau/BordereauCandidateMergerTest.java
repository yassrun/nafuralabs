package ma.nafura.etudes.service.bordereau;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;

class BordereauCandidateMergerTest {

    private final BordereauCandidateMerger merger = new BordereauCandidateMerger();

    @Test
    void dedupe_mergesSameKeyPreferringDeterministicValues() {
        BordereauRowCandidate local = new BordereauRowCandidate(
                "r0", 1, 0, "1-1-1", "FOUILLES", "M3", new BigDecimal("10"),
                BordereauRowCandidate.Kind.ARTICLE, 0.9, "local",
                BordereauRowCandidate.ExtractionMethod.PDFBOX, "local");
        BordereauRowCandidate llm = new BordereauRowCandidate(
                "r99", 1, 1, "1-1-1", "FOUILLES", "M3", new BigDecimal("10"),
                BordereauRowCandidate.Kind.ARTICLE, 0.5, "llm",
                BordereauRowCandidate.ExtractionMethod.LLM_TEXT, "llm");

        BordereauParseResult base = new BordereauParseResult(
                1, 100, List.of(local), Set.of(1), BordereauParseResult.Quality.USABLE, null);
        BordereauParseResult merged = merger.merge(base, List.of(llm));

        assertThat(merged.articleCandidates()).hasSize(1);
        assertThat(merged.articleCandidates().get(0).unite()).isEqualTo("M3");
        assertThat(merged.articleCandidates().get(0).method())
                .isEqualTo(BordereauRowCandidate.ExtractionMethod.PDFBOX);
    }

    @Test
    void mergePreferringLocal_fillsMissingUnitFromLlm() {
        BordereauRowCandidate local = new BordereauRowCandidate(
                "r0", 1, 0, "1-1-1", "FOUILLES", null, null,
                BordereauRowCandidate.Kind.AMBIGUOUS, 0.6, "local",
                BordereauRowCandidate.ExtractionMethod.PDFBOX, "local");
        BordereauRowCandidate llm = new BordereauRowCandidate(
                "r0", 1, 0, "1-1-1", "FOUILLES", "M3", new BigDecimal("10"),
                BordereauRowCandidate.Kind.ARTICLE, 0.7, "llm",
                BordereauRowCandidate.ExtractionMethod.LLM_TEXT, "llm");

        BordereauRowCandidate merged = local.mergePreferringLocal(llm);
        assertThat(merged.unite()).isEqualTo("M3");
        assertThat(merged.quantite()).isEqualByComparingTo("10");
        assertThat(merged.method()).isEqualTo(BordereauRowCandidate.ExtractionMethod.PDFBOX);
        assertThat(merged.looksLikeArticle()).isTrue();
    }
}
