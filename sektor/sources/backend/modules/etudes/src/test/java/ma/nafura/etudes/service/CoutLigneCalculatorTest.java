package ma.nafura.etudes.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class CoutLigneCalculatorTest {

    private final DpuCalculator calc = new DpuCalculator();

    @Test
    void chaineMultiplicative_46_vers_53_16() {
        BigDecimal cout = new BigDecimal("46.00");
        BigDecimal fg = new BigDecimal("8");
        BigDecimal marge = new BigDecimal("7");

        BigDecimal revient = calc.computeCoutRevient(cout, fg);
        BigDecimal vente = calc.computePrixVenteDepuisCout(cout, fg, marge);

        assertEquals(0, new BigDecimal("49.68").compareTo(revient));
        assertEquals(0, new BigDecimal("53.16").compareTo(vente));
    }

    @Test
    void deductionPrixVente_1000_vers_865_33() {
        BigDecimal prix = new BigDecimal("1000");
        BigDecimal fg = new BigDecimal("8");
        BigDecimal marge = new BigDecimal("7");

        BigDecimal cout = calc.deduceCoutDepuisPrixVente(prix, fg, marge);
        assertEquals(0, new BigDecimal("865.35").compareTo(cout)); // 1000/1.1556 ≈ 865.35

        BigDecimal revente = calc.computePrixVenteDepuisCout(cout, fg, marge);
        assertEquals(0, new BigDecimal("1000.00").compareTo(revente));
    }

    @Test
    void computePrixVenteHt_additif_inchange_corpus() {
        // R2 — ne pas modifier : 46 × (1+0.08+0.07) = 52.90
        BigDecimal vente = calc.computePrixVenteHt(
                new BigDecimal("46"), new BigDecimal("8"), new BigDecimal("7"));
        assertEquals(0, new BigDecimal("52.90").compareTo(vente));
    }
}
