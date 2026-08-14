package ma.nafura.rh.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class FichePaieCalculatorTest {

    @Test
    void compute_emp001_april_noHeuresSup() {
        FichePaieCalculator.PaieComputed result = FichePaieCalculator.compute(
                bd("4200"), bd("0"), bd("300"), bd("0"));

        assertAmount("4500", result.salaireBrut());
        assertAmount("188.16", result.cotisationCnss());
        assertAmount("101.70", result.cotisationAmo());
        assertAmount("289.86", result.totalRetenues());
        assertAmount("4210.14", result.salaireNetImposable());
        assertAmount("175.36", result.igr());
        assertAmount("4034.78", result.salaireNetAPayer());
    }

    @Test
    void compute_emp001_may_withHeuresSup() {
        FichePaieCalculator.PaieComputed result = FichePaieCalculator.compute(
                bd("4200"), bd("0"), bd("300"), bd("150"));

        assertAmount("4650", result.salaireBrut());
        assertAmount("188.16", result.cotisationCnss());
        assertAmount("105.09", result.cotisationAmo());
        assertAmount("293.25", result.totalRetenues());
        assertAmount("4356.75", result.salaireNetImposable());
        assertAmount("204.68", result.igr());
        assertAmount("4152.07", result.salaireNetAPayer());
    }

    @Test
    void compute_cnssPlafond_capsAt6000() {
        FichePaieCalculator.PaieComputed result = FichePaieCalculator.compute(
                bd("8000"), bd("0"), bd("0"), bd("0"));

        assertAmount("268.80", result.cotisationCnss());
    }

    @Test
    void compute_lowSalary_noIgr() {
        FichePaieCalculator.PaieComputed result = FichePaieCalculator.compute(
                bd("2400"), bd("0"), bd("200"), bd("0"));

        assertAmount("0", result.igr());
        assertEquals(0, result.salaireNetAPayer().compareTo(result.salaireNetImposable()));
    }

    private static BigDecimal bd(String value) {
        return new BigDecimal(value);
    }

    private static void assertAmount(String expected, BigDecimal actual) {
        assertEquals(0, new BigDecimal(expected).compareTo(actual), () -> "expected " + expected + " but was " + actual);
    }
}
