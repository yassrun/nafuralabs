package ma.nafura.marches.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.Map;
import org.junit.jupiter.api.Test;

class RevisionPrixServiceTest {

    private static final FormuleRevisionK FORMULE_MAR002 = FormuleRevisionK.builder()
            .termeFixe(new BigDecimal("0.15"))
            .termesVariables(java.util.List.of(
                    new FormuleRevisionK.TermeVariable(
                            new BigDecimal("0.50"), "BTP18", new BigDecimal("1250")),
                    new FormuleRevisionK.TermeVariable(
                            new BigDecimal("0.20"), "BTP01", new BigDecimal("980")),
                    new FormuleRevisionK.TermeVariable(
                            new BigDecimal("0.15"), "MO", new BigDecimal("740"))))
            .build();

    @Test
    void calculerK_mar002_2026_04_matchesKnownIndices() {
        Map<String, BigDecimal> indices = Map.of(
                "BTP18", new BigDecimal("1325"),
                "BTP01", new BigDecimal("1028"),
                "MO", new BigDecimal("762"));

        BigDecimal k = RevisionPrixKCalculator.calculerK(FORMULE_MAR002, indices);

        // K = (0.15 + 0.50*1325/1250 + 0.20*1028/980 + 0.15*762/740) / 1.0
        assertThat(k).isEqualByComparingTo("1.04425538");
    }

    @Test
    void calculerK_mar002_2026_02_matchesKnownIndices() {
        Map<String, BigDecimal> indices = Map.of(
                "BTP18", new BigDecimal("1295"),
                "BTP01", new BigDecimal("1015"),
                "MO", new BigDecimal("755"));

        BigDecimal k = RevisionPrixKCalculator.calculerK(FORMULE_MAR002, indices);

        assertThat(k).isEqualByComparingTo("1.02818340");
    }
}
