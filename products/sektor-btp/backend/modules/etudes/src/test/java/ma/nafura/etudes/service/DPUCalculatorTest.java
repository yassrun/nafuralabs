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

    // ⚠️ TOUS CES NOMBRES SONT INVENTÉS — aucun n'a été validé par l'expert métier.
    //
    // Ils forment un jeu arithmétiquement cohérent, rien de plus. FG=8 et MARGE=7 en
    // particulier proviennent du socle généré, pas d'un arbitrage : ce ne sont PAS les
    // taux de l'entreprise, et ces taux sont vraisemblablement variables par affaire.
    //
    // Ce que ces tests verrouillent, c'est la STRUCTURE du calcul — déboursé unitaire,
    // ordre des étages, quantité du bordereau appliquée une seule fois. Cette structure
    // est définitive ; les nombres seront remplacés par le sous-détail B35 réel sans
    // toucher aux assertions de structure.
    //
    // TODO(metier): remplacer par le sous-détail B35 fourni par l'expert métier.
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
        // 735.50 × 1.08 = 794.34 ; 794.34 × 1.07 = 849.9438 → 849.94 HALF_UP
        assertThat(prixVenteHt).isEqualByComparingTo(new BigDecimal("849.94"));
    }

    @Test
    void invariant_prixVenteTtc() {
        // TODO(metier): valeurs d'illustration, à remplacer par le sous-détail B35 réel.
        // La STRUCTURE du test est définitive ; seuls les nombres changeront.
        BigDecimal prixVenteHt = new BigDecimal("849.94");
        // 849.94 × 1.20 = 1019.928 → 1019.93 HALF_UP
        assertThat(calculator.computePrixVenteTtc(prixVenteHt, TVA))
                .isEqualByComparingTo(new BigDecimal("1019.93"));
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
        // 70 × 849.94 = 59495.80
        assertThat(totalLigne).isEqualByComparingTo(new BigDecimal("59495.80"));

        // Le déboursé est UNITAIRE : il ne dépend jamais de la quantité du bordereau.
        assertThat(deboursSec).isEqualByComparingTo(new BigDecimal("735.50"));

        // Équivalence à l'ordre d'arrondi près : la multiplication est commutative, donc
        // (déboursé × qté) × coefs ≈ qté × (déboursé × coefs). Seul l'arrondi intermédiaire
        // les sépare — ce n'est PAS le bug recherché.
        BigDecimal sansArrondiIntermediaire = deboursSec
                .multiply(QTE_BORDEREAU)
                .multiply(BigDecimal.ONE.add(FG.movePointLeft(2)))
                .multiply(BigDecimal.ONE.add(MARGE.movePointLeft(2)))
                .setScale(2, RoundingMode.HALF_UP);
        assertThat(totalLigne.subtract(sansArrondiIntermediaire).abs())
                .isLessThan(new BigDecimal("1.00"));

        // GARDE-FOU (bug consultation) : la quantité du bordereau ne doit JAMAIS être
        // comptée deux fois. Si le déboursé incluait déjà la quantité, on obtiendrait ceci.
        BigDecimal doubleComptage = calculator.computeLineTotal(
                QTE_BORDEREAU,
                calculator.computePrixVenteHt(deboursSec.multiply(QTE_BORDEREAU), FG, MARGE));
        assertThat(totalLigne).isNotEqualByComparingTo(doubleComptage);
        assertThat(doubleComptage).isGreaterThan(totalLigne.multiply(new BigDecimal("50")));
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
