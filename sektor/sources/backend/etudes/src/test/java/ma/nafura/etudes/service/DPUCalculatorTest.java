package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import ma.nafura.etudes.domain.dpu.ComposantDpu;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * Verrouille l'invariant structurel de la chaîne de prix (lot 1 T1.1).
 * Formule : prixVenteHt = déboursé × (1 + FG% + marge%).
 */
class DPUCalculatorTest {

    private DpuCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new DpuCalculator();
    }

    // Sous-detail B35 — trois niveaux de fiabilite, a ne pas confondre.
    //
    // NORME (fiable) : le dosage d'un beton B35 est normalise, ce n'est pas une pratique
    //   d'entreprise. 400 kg de CPJ 45 par m3, ~0,42 m3 de sable, ~0,82 m3 de gravier,
    //   ~180 l d'eau. Ces valeurs font autorite.
    //
    // REX (plausible, non validee) : prix unitaires marche marocain, et rendement de
    //   main d'oeuvre pose a 6 personnes pour 12 m3/jour, soit 4 h/m3. Ordre de grandeur
    //   courant, mais le rendement reel depend des equipes — c'est un FAIT SUR L'ENTREPRISE,
    //   pas une question d'expertise. A remplacer par la fiche remplie par l'expert metier.
    //
    // TAUX : FG 11,5 % et marge 17,5 % = milieu des fourchettes donnees par l'expert
    //   (10-13 % et 15-20 %). Voir ParametresEtudeService.
    //
    // Ce que ces tests verrouillent reste la STRUCTURE du calcul. Les nombres peuvent bouger
    // sans toucher aux assertions de structure.
    private static final BigDecimal CIMENT_REND = new BigDecimal("400");     // NORME kg/m3
    private static final BigDecimal CIMENT_PU = new BigDecimal("1.20");      // REX  DH/kg
    private static final BigDecimal SABLE_REND = new BigDecimal("0.42");     // NORME m3/m3
    private static final BigDecimal SABLE_PU = new BigDecimal("180");        // REX  DH/m3
    private static final BigDecimal GRAVIER_REND = new BigDecimal("0.82");   // NORME m3/m3
    private static final BigDecimal GRAVIER_PU = new BigDecimal("220");      // REX  DH/m3
    private static final BigDecimal EAU_REND = new BigDecimal("180");        // NORME l/m3
    private static final BigDecimal EAU_PU = new BigDecimal("0.01");         // REX  DH/l
    private static final BigDecimal MATERIEL_REND = new BigDecimal("0.35");  // REX  h/m3
    private static final BigDecimal MATERIEL_PU = new BigDecimal("80");      // REX  DH/h
    // MO : 6 personnes x 8 h / 12 m3 par jour = 4 h/m3 — cf. lot 4, saisie en rendement
    // journalier d'equipe, la conversion en h/unite est faite par l'outil.
    private static final BigDecimal MO_REND = new BigDecimal("4");           // REX  h/m3
    private static final BigDecimal MO_PU = new BigDecimal("45");            // REX  DH/h
    private static final BigDecimal FG = new BigDecimal("11.5");
    private static final BigDecimal MARGE = new BigDecimal("17.5");
    private static final BigDecimal TVA = new BigDecimal("20");
    private static final BigDecimal QTE_BORDEREAU = new BigDecimal("70");

    @Test
    void invariant_deboursSecEstUnitaire_sommeRendementFoisPu() {
        // TODO(metier): valeurs d'illustration, à remplacer par le sous-détail B35 réel.
        // La STRUCTURE du test est définitive ; seuls les nombres changeront.
        List<ComposantDpu> composants = betonB35Illustration();
        calculator.recomputeLineTotals(composants);

        BigDecimal deboursSec = calculator.computeDeboursSec(composants);

        // 400x1.20 + 0.42x180 + 0.82x220 + 180x0.01 + 0.35x80 + 4x45
        // = 480 + 75.60 + 180.40 + 1.80 + 28 + 180 = 945.80 DH/m3
        assertThat(deboursSec).isEqualByComparingTo(new BigDecimal("945.80"));
    }

    @Test
    void invariant_coutDeRevientPuisPrixVenteHt() {
        // TODO(metier): valeurs d'illustration, à remplacer par le sous-détail B35 réel.
        // La STRUCTURE du test est définitive ; seuls les nombres changeront.
        BigDecimal deboursSec = new BigDecimal("945.80");
        BigDecimal coutDeRevient = deboursSec
                .multiply(BigDecimal.ONE.add(FG.movePointLeft(2)))
                .setScale(2, RoundingMode.HALF_UP);
        assertThat(coutDeRevient).isEqualByComparingTo(new BigDecimal("1054.57"));

        BigDecimal prixVenteHt = calculator.computePrixVenteHt(deboursSec, FG, MARGE);
        // 945.80 × (1 + 0.115 + 0.175) = 945.80 × 1.29 = 1220.082 → 1220.08
        assertThat(prixVenteHt).isEqualByComparingTo(new BigDecimal("1220.08"));
    }

    @Test
    void invariant_prixVenteTtc() {
        // TODO(metier): valeurs d'illustration, à remplacer par le sous-détail B35 réel.
        // La STRUCTURE du test est définitive ; seuls les nombres changeront.
        BigDecimal prixVenteHt = new BigDecimal("1220.08");
        // 1220.08 x 1.20 = 1464.096 → 1464.10 HALF_UP
        assertThat(calculator.computePrixVenteTtc(prixVenteHt, TVA))
                .isEqualByComparingTo(new BigDecimal("1464.10"));
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
        // 70 × 1220.08 = 85405.60
        assertThat(totalLigne).isEqualByComparingTo(new BigDecimal("85405.60"));

        // Le déboursé est UNITAIRE : il ne dépend jamais de la quantité du bordereau.
        assertThat(deboursSec).isEqualByComparingTo(new BigDecimal("945.80"));

        // Équivalence à l'ordre d'arrondi près : la multiplication est commutative, donc
        // (déboursé × qté) × coefs ≈ qté × (déboursé × coefs). Seul l'arrondi intermédiaire
        // les sépare — ce n'est PAS le bug recherché.
        BigDecimal sansArrondiIntermediaire = deboursSec
                .multiply(QTE_BORDEREAU)
                .multiply(BigDecimal.ONE.add(FG.movePointLeft(2)).add(MARGE.movePointLeft(2)))
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
                .isEqualByComparingTo(new BigDecimal("1150.00"));
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
                composant(EAU_REND, EAU_PU),
                composant(MATERIEL_REND, MATERIEL_PU),
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
