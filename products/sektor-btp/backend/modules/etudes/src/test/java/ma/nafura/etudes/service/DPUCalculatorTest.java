package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;
import ma.nafura.etudes.domain.model.ComposantDpu;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class DPUCalculatorTest {

    private DpuCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new DpuCalculator();
    }

    @Test
    void computePrixVenteHtAppliesFgAndMarge() {
        assertThat(calculator.computePrixVenteHt(new BigDecimal("1000"), new BigDecimal("8"), new BigDecimal("7")))
                .isEqualByComparingTo(new BigDecimal("1155.60"));
        assertThat(calculator.computePrixVenteHt(BigDecimal.ZERO, new BigDecimal("10"), new BigDecimal("10")))
                .isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void computeDeboursSecSumsComponentTotals() {
        ComposantDpu line = ComposantDpu.builder()
                .quantite(new BigDecimal("2"))
                .prixUnitaire(new BigDecimal("100"))
                .total(BigDecimal.ZERO)
                .build();
        calculator.recomputeLineTotals(List.of(line));

        assertThat(calculator.computeDeboursSec(List.of(line))).isEqualByComparingTo(new BigDecimal("200.00"));
    }

    @Test
    void computePrixVenteTtcIncludesTva() {
        BigDecimal ttc = calculator.computePrixVenteTtc(new BigDecimal("100"), new BigDecimal("20"));
        assertThat(ttc).isEqualByComparingTo(new BigDecimal("120.00"));
    }
}
