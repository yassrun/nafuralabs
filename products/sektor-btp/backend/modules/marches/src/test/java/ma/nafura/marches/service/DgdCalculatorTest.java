package ma.nafura.marches.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class DgdCalculatorTest {

    private DgdCalculatorService calculator;

    @BeforeEach
    void setUp() {
        calculator = new DgdCalculatorService();
    }

    @Test
    void computeMontantNetAPayer_appliesBMar04Formula() {
        BigDecimal result = calculator.computeMontantNetAPayer(
                new BigDecimal("5004000"),
                new BigDecimal("291900"),
                new BigDecimal("22400"),
                new BigDecimal("0"),
                new BigDecimal("50000"));

        assertThat(result).isEqualByComparingTo("4784500");
    }

    @Test
    void computeMontantNetAPayer_subtractsPenalitesAndRetenueGarantie() {
        BigDecimal result = calculator.computeMontantNetAPayer(
                new BigDecimal("1000000"),
                new BigDecimal("70000"),
                new BigDecimal("10000"),
                new BigDecimal("5000"),
                BigDecimal.ZERO);

        assertThat(result).isEqualByComparingTo("935000.0000");
    }

    @Test
    void computeMontantNetAPayer_treatsNullAsZero() {
        BigDecimal result = calculator.computeMontantNetAPayer(
                new BigDecimal("1000"), null, null, null, null);

        assertThat(result).isEqualByComparingTo("1000.0000");
    }
}
