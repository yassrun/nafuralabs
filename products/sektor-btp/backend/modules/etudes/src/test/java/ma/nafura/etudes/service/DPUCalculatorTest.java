package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import ma.nafura.etudes.domain.model.ComposantDpu;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * Verrouille l'invariant structurel de la chaîne de prix (lot 1 T1.1).
 * Ne pas modifier DpuCalculator.computePrixVenteHt — formule validée métier (R2).
 */
class DPUCalculatorTest {

    private DpuCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new DpuCalculator();
    }

    // TODO(metier): valeurs d'illustration, à remplacer par le sous-détail B35 réel.
    // La STRUCTURE du test est définitive ; seuls les nombres changeront.
    private static final BigDecimal CIMENT_REND = new BigDecimal("350");
    private static final BigDecimal CIMENT_PU = new BigDecimal("1.20");
    private static final BigDecimal SABLE_REND = new BigDecimal("0.4");
    private static final BigDecimal SABLE_PU = new BigDecimal("180");
    private static final BigDecimal GRAVIER_REND = new BigDecimal("0.8");
    private static final BigDecimal GRAVIER_PU = new BigDecimal("220");
    private static final BigDecimal MO_REND = new BigDecimal("1.5");
    private static final BigDecimal MO_PU = new BigDecimal("45");
    private static final BigDecimal FG = new BigDecimal("8");
    private static final BigDecimal MARGE = new BigDecimal("7");
    private static final BigDecimal TVA = new BigDecimal("20");
    private static final BigDecimal QTE_BORDEREAU = new BigDecimal("70");

    @Test
    void invariant_deboursSecEstUnitaire_sommeRendementFoisPu() {
        // TODO(metier): valeurs d'illustration, à remplacer par le sous-détail B35 réel.
        // La STRUCTURE du test est définitive ; seuls les nombres changeront.
        List<ComposantDpu> composants = betonB35Illustration();
        calculator.recomputeLineTotals(composants);

        BigDecimal deboursSec = calculator.computeDeboursSec(composants);

        // 350×1.20 + 0.4×180 + 0.8×220 + 1.5×45 = 420 + 72 + 176 + 67.5 = 735.50
        assertThat(deboursSec).isEqualByComparingTo(new BigDecimal("735.50"));
    }

    @Test
    void invariant_coutDeRevientPuisPrixVenteHt() {
        // TODO(metier): valeurs d'illustration, à remplacer par le sous-détail B35 réel.
        // La STRUCTURE du test est définitive ; seuls les nombres changeront.
        BigDecimal deboursSec = new BigDecimal("735.50");
        BigDecimal coutDeRevient = deboursSec
                .multiply(BigDecimal.ONE.add(FG.movePointLeft(2)))
                .setScale(2, RoundingMode.HALF_UP);
        assertThat(coutDeRevient).isEqualByComparingTo(new BigDecimal("794.34"));

        BigDecimal prixVenteHt = calculator.computePrixVenteHt(deboursSec, FG, MARGE);
        // 735.50 × 1.08 × 1.07 = 849.8634 → 849.86 HALF_UP
        assertThat(prixVenteHt).isEqualByComparingTo(new BigDecimal("849.86"));
    }

    @Test
    void invariant_prixVenteTtc() {
        // TODO(metier): valeurs d'illustration, à remplacer par le sous-détail B35 réel.
        // La STRUCTURE du test est définitive ; seuls les nombres changeront.
        BigDecimal prixVenteHt = new BigDecimal("849.86");
        assertThat(calculator.computePrixVenteTtc(prixVenteHt, TVA))
                .isEqualByComparingTo(new BigDecimal("1019.83"));
    }

    @Test
    void invariant_totalLigneBordereau_quantiteFoisPrixVenteHt_uneSeuleFois() {
        // TODO(metier): valeurs d'illustration, à remplacer par le sous-détail B35 réel.
        // La STRUCTURE du test est définitive ; seuls les nombres changeront.
        List<ComposantDpu> composants = betonB35Illustration();
        calculator.recomputeLineTotals(composants);
        BigDecimal deboursSec = calculator.computeDeboursSec(composants);
        BigDecimal prixVenteHt = calculator.computePrixVenteHt(deboursSec, FG, MARGE);

        // La quantité bordereau n'intervient QU'ICI — jamais dans le déboursé
        BigDecimal totalLigne = calculator.computeLineTotal(QTE_BORDEREAU, prixVenteHt);
        assertThat(totalLigne).isEqualByComparingTo(new BigDecimal("59490.20"));

        // Garde-fou anti double multiplication (bug consultation)
        BigDecimal doubleMultiplication = deboursSec
                .multiply(QTE_BORDEREAU)
                .multiply(BigDecimal.ONE.add(FG.movePointLeft(2)))
                .multiply(BigDecimal.ONE.add(MARGE.movePointLeft(2)))
                .setScale(2, RoundingMode.HALF_UP);
        assertThat(deboursSec).isNotEqualByComparingTo(deboursSec.multiply(QTE_BORDEREAU));
        assertThat(totalLigne).isEqualByComparingTo(doubleMultiplication);
        assertThat(deboursSec).isEqualByComparingTo(new BigDecimal("735.50"));
    }

    @Test
    void rendementNul_composantAZero() {
        ComposantDpu line = composant(BigDecimal.ZERO, new BigDecimal("100"));
        calculator.recomputeLineTotals(List.of(line));
        assertThat(line.getTotal()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(calculator.computeDeboursSec(List.of(line))).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void composantsVides_deboursZero() {
        assertThat(calculator.computeDeboursSec(List.of())).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(calculator.computeDeboursSec(null)).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void rendementNegatif_rameneAZero() {
        ComposantDpu line = composant(new BigDecimal("-5"), new BigDecimal("100"));
        calculator.recomputeLineTotals(List.of(line));
        assertThat(line.getTotal()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void arrondiHalfUpScale2_sansAccumulationErreur() {
        // 1/3 × 10 = 3.333… → chaque ligne arrondie, somme stable
        ComposantDpu a = composant(new BigDecimal("0.333"), new BigDecimal("10"));
        ComposantDpu b = composant(new BigDecimal("0.333"), new BigDecimal("10"));
        ComposantDpu c = composant(new BigDecimal("0.334"), new BigDecimal("10"));
        List<ComposantDpu> lines = List.of(a, b, c);
        calculator.recomputeLineTotals(lines);
        assertThat(a.getTotal()).isEqualByComparingTo(new BigDecimal("3.33"));
        assertThat(b.getTotal()).isEqualByComparingTo(new BigDecimal("3.33"));
        assertThat(c.getTotal()).isEqualByComparingTo(new BigDecimal("3.34"));
        assertThat(calculator.computeDeboursSec(lines)).isEqualByComparingTo(new BigDecimal("10.00"));
    }

    @Test
    void computePrixVenteHtAppliesFgAndMarge() {
        assertThat(calculator.computePrixVenteHt(new BigDecimal("1000"), new BigDecimal("8"), new BigDecimal("7")))
                .isEqualByComparingTo(new BigDecimal("1155.60"));
        assertThat(calculator.computePrixVenteHt(BigDecimal.ZERO, new BigDecimal("10"), new BigDecimal("10")))
                .isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void computePrixVenteTtcIncludesTva() {
        assertThat(calculator.computePrixVenteTtc(new BigDecimal("100"), new BigDecimal("20")))
                .isEqualByComparingTo(new BigDecimal("120.00"));
    }

    private List<ComposantDpu> betonB35Illustration() {
        return List.of(
                composant(CIMENT_REND, CIMENT_PU),
                composant(SABLE_REND, SABLE_PU),
                composant(GRAVIER_REND, GRAVIER_PU),
                composant(MO_REND, MO_PU));
    }

    private ComposantDpu composant(BigDecimal rendement, BigDecimal prixUnitaire) {
        return ComposantDpu.builder()
                .rendement(rendement)
                .prixUnitaire(prixUnitaire)
                .total(BigDecimal.ZERO)
                .build();
    }
}
