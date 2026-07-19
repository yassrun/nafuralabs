package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;
import ma.nafura.etudes.domain.model.ComposantDpu;
import org.junit.jupiter.api.Test;

/**
 * Reference du calcul : le sous-detail reel de l'entreprise.
 *
 * <p>Source : classeur « LOT N° 2 GROS-OEUVRE — REVETEMENTS ETANCHEITE — PEINTURE », transmis
 * par l'expert metier le 2026-07-19, feuilles « Beton sur chantier » et
 * « TERRASSEMENTS GENERAUX ».
 *
 * <p>Contrairement aux valeurs d'illustration de {@code DPUCalculatorTest}, <b>tous les nombres
 * ci-dessous sont ceux de l'entreprise</b> et les totaux attendus sont ceux calcules par son
 * propre classeur. C'est cette classe qui fait foi.
 */
class DpuCalculatorSousDetailReelTest {

    private final DpuCalculator calculator = new DpuCalculator();

    private static ComposantDpu parUnite(String rendement, String pu) {
        return ComposantDpu.builder()
                .rendement(new BigDecimal(rendement))
                .prixUnitaire(new BigDecimal(pu))
                .baseRendement(ComposantDpu.BASE_PAR_UNITE)
                .build();
    }

    private static ComposantDpu parJour(String quantiteJours, String pu) {
        return ComposantDpu.builder()
                .rendement(new BigDecimal(quantiteJours))
                .prixUnitaire(new BigDecimal(pu))
                .baseRendement(ComposantDpu.BASE_PAR_JOUR)
                .build();
    }

    @Test
    void beton_dose_350_composants_deja_unitaires() {
        // Feuille « Beton sur chantier », ouvrage a. Le dosage reel est 350 kg de ciment,
        // pas 400 : la norme donne une fourchette, l'entreprise a sa formulation.
        // Les granulats sont comptes en TONNES, pas en metres cubes.
        List<ComposantDpu> composants = List.of(
                parUnite("350", "1.20"),   // ciment CI-25, kg
                parUnite("0.8", "120"),    // gravette GRA-1, tonne
                parUnite("0.4", "200"));   // sable SA-A, tonne

        calculator.recomputeLineTotals(composants);
        BigDecimal debourse = calculator.computeDeboursSec(composants, null);

        // 420 + 96 + 80 — total du classeur : 596 DH/m3
        assertThat(debourse).isEqualByComparingTo(new BigDecimal("596.00"));
    }

    @Test
    void production_couts_journaliers_ramenes_par_le_rendement() {
        // Ouvrage b : une journee d'equipe complete, divisee par la production du jour.
        // C'est la forme dans laquelle l'entreprise raisonne — pas des heures par m3.
        List<ComposantDpu> composants = List.of(
                parJour("1", "400"),     // betonniere, jour
                parJour("1", "100"),     // eau + electricite, forfait jour
                parJour("1", "1000"),    // tracteur + chauffeur, jour
                parJour("5", "150"));    // main d'oeuvre, 5 jours-homme

        calculator.recomputeLineTotals(composants);
        BigDecimal debourse = calculator.computeDeboursSec(composants, new BigDecimal("30"));

        // (400 + 100 + 1000 + 750) / 30 m3 par jour — total du classeur : 75 DH/m3
        assertThat(debourse).isEqualByComparingTo(new BigDecimal("75.00"));
    }

    @Test
    void coffrage_rendements_unitaires_en_jours_par_m3() {
        // Ouvrage c : la main d'oeuvre est ici deja rapportee au m3 (0,5 jour par m3),
        // sans passer par un rendement journalier. Les deux formes coexistent.
        List<ComposantDpu> composants = List.of(
                parUnite("0.5", "160"),  // coffreur, jours par m3
                parUnite("0.5", "130"),  // ouvrier, jours par m3
                parUnite("2", "50"));    // coffrage, forfait

        calculator.recomputeLineTotals(composants);
        BigDecimal debourse = calculator.computeDeboursSec(composants, null);

        // 80 + 65 + 100 — total du classeur : 245 DH/m3
        assertThat(debourse).isEqualByComparingTo(new BigDecimal("245.00"));
    }

    @Test
    void deblais_en_masse_base_MIXTE_dans_un_meme_ouvrage() {
        // Feuille « TERRASSEMENTS GENERAUX » : =SUM(J3+J5)/100+J4
        // La tractopelle et les pannes sont journalieres, le gasoil est deja au m3.
        // C'est le cas qui interdit de choisir une base unique pour tout un ouvrage.
        List<ComposantDpu> composants = List.of(
                parJour("1", "1500"),    // tractopelle, jour
                parUnite("1", "10"),     // gasoil, deja au m3
                parJour("1", "200"));    // pannes et aleas, jour

        calculator.recomputeLineTotals(composants);
        BigDecimal debourse = calculator.computeDeboursSec(composants, new BigDecimal("100"));

        // (1500 + 200) / 100 + 10 — total du classeur : 27 DH/m3
        assertThat(debourse).isEqualByComparingTo(new BigDecimal("27.00"));
    }

    @Test
    void beton_en_fondation_ouvrage_composite_sur_trois_niveaux() {
        // Ouvrage A : compose de trois SOUS-OUVRAGES et d'un forfait. Confirme la decision D9
        // — un ouvrage peut en contenir d'autres — sur la pratique reelle, et sur trois
        // niveaux : Beton en fondation -> Beton dose 350 -> ciment / gravette / sable.
        List<ComposantDpu> composants = List.of(
                parUnite("1", "596"),    // B25C, sous-ouvrage « Beton dose 350 »
                parUnite("1", "75"),     // PROD, sous-ouvrage « Production »
                parUnite("1", "245"),    // COFF, sous-ouvrage « Coffrage »
                parUnite("1", "50"));    // ALEAS, forfait

        calculator.recomputeLineTotals(composants);
        BigDecimal debourse = calculator.computeDeboursSec(composants, null);

        // Total du classeur : 966 DH/m3
        assertThat(debourse).isEqualByComparingTo(new BigDecimal("966.00"));
    }

    @Test
    void des_couts_journaliers_sans_rendement_sont_ignores_pas_additionnes() {
        // Garde-fou : additionner un cout de journee a des couts unitaires gonflerait le
        // deboursé d'un facteur egal a la production journaliere. Mieux vaut ne rien compter
        // et que le gate de l'etape 3 signale l'ouvrage incomplet.
        List<ComposantDpu> composants = List.of(
                parUnite("350", "1.20"),
                parJour("1", "1000"));

        calculator.recomputeLineTotals(composants);
        BigDecimal debourse = calculator.computeDeboursSec(composants, null);

        assertThat(debourse).isEqualByComparingTo(new BigDecimal("420.00"));
    }

    @Test
    void prix_de_vente_du_beton_en_fondation_avec_les_taux_de_l_entreprise() {
        // Deboursé reel 966, FG 11,5 % et marge 17,5 % (milieux des fourchettes 10-13 et 15-20
        // donnees par l'expert). La formule elle-meme reste inchangee (R2).
        BigDecimal pv = calculator.computePrixVenteHt(
                new BigDecimal("966"), new BigDecimal("11.5"), new BigDecimal("17.5"));

        // 966 x 1,115 = 1077,09 ; x 1,175 = 1265,58
        assertThat(pv).isEqualByComparingTo(new BigDecimal("1265.58"));
    }
}
