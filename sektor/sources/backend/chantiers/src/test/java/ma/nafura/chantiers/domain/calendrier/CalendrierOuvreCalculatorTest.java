package ma.nafura.chantiers.domain.calendrier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import org.junit.jupiter.api.Test;

/** SEKTOR-326 — AC04, exception de fermeture, fuseau IANA, historique 7 j. */
class CalendrierOuvreCalculatorTest {

    /** Vendredi 11 septembre 2026. */
    private static final LocalDate VENDREDI = LocalDate.of(2026, 9, 11);
    private static final LocalDate SAMEDI = LocalDate.of(2026, 9, 12);
    private static final LocalDate LUNDI = LocalDate.of(2026, 9, 14);
    private static final int HUIT_HEURES = 480;
    private static final int SEIZE_HEURES = 960;

    @Test
    void ac04_huitHeuresVendredi_finitVendredi() {
        CalendrierOuvreCalculator cal = CalendrierOuvreCalculator.standard(CalendrierOuvreCalculator.FUSEAU_DEFAUT);

        assertThat(cal.deriveInclusiveFin(VENDREDI, HUIT_HEURES)).isEqualTo(VENDREDI);
    }

    @Test
    void ac04_seizeHeuresVendredi_weekEndFerme_finitLundi() {
        CalendrierOuvreCalculator cal = CalendrierOuvreCalculator.standard(CalendrierOuvreCalculator.FUSEAU_DEFAUT);

        assertThat(cal.deriveInclusiveFin(VENDREDI, SEIZE_HEURES)).isEqualTo(LUNDI);
    }

    @Test
    void ac04_seizeHeuresVendredi_samediOuvert_finitSamedi() {
        CalendrierOuvreCalculator cal = lundiSamedi(CalendrierOuvreCalculator.FUSEAU_DEFAUT);

        assertThat(cal.deriveInclusiveFin(VENDREDI, SEIZE_HEURES)).isEqualTo(SAMEDI);
    }

    @Test
    void exceptionFermeture_retireHeuresFutures_samediFermeDoncLundi() {
        CalendrierOuvreCalculator ouvert = lundiSamedi(CalendrierOuvreCalculator.FUSEAU_DEFAUT);
        assertThat(ouvert.deriveInclusiveFin(VENDREDI, SEIZE_HEURES)).isEqualTo(SAMEDI);

        CalendrierOuvreCalculator avecFermeture = new CalendrierOuvreCalculator(List.of(new CalendrierOuvreCalculator.Version(
                LocalDate.of(1900, 1, 1),
                ZoneId.of(CalendrierOuvreCalculator.FUSEAU_DEFAUT),
                lundiSamediCreneaux(),
                List.of(CalendrierOuvreCalculator.ExceptionJour.fermeture(SAMEDI)))));

        assertThat(avecFermeture.deriveInclusiveFin(VENDREDI, SEIZE_HEURES)).isEqualTo(LUNDI);
        assertThat(avecFermeture.minutesOuvrees(SAMEDI)).isZero();
    }

    @Test
    void historiqueSeptJours_samediEstOuvre_nePresumePasLundiVendredi() {
        CalendrierOuvreCalculator cal = CalendrierOuvreCalculator.historique(CalendrierOuvreCalculator.FUSEAU_DEFAUT);

        assertThat(cal.deriveInclusiveFin(SAMEDI, HUIT_HEURES)).isEqualTo(SAMEDI);
        assertThat(cal.minutesOuvrees(SAMEDI)).isEqualTo(HUIT_HEURES);
        assertThat(cal.minutesOuvrees(LocalDate.of(2026, 9, 13))).isEqualTo(HUIT_HEURES);
    }

    @Test
    void fuseauIana_invalide_refuse() {
        assertThatThrownBy(() -> CalendrierOuvreCalculator.zoneOrThrow("UTC+1"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(CalendrierOuvreCalculator.ERR_FUSEAU);
        assertThatThrownBy(() -> CalendrierOuvreCalculator.zoneOrThrow("Not/AZone"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(CalendrierOuvreCalculator.ERR_FUSEAU);
        assertThat(CalendrierOuvreCalculator.zoneOrThrow("Africa/Casablanca").getId())
                .isEqualTo("Africa/Casablanca");
    }

    @Test
    void fuseau_affichageLocal_memeDatesCasablancaEtParis() {
        CalendrierOuvreCalculator casa = CalendrierOuvreCalculator.standard("Africa/Casablanca");
        CalendrierOuvreCalculator paris = CalendrierOuvreCalculator.standard("Europe/Paris");

        assertThat(casa.deriveInclusiveFin(VENDREDI, HUIT_HEURES)).isEqualTo(VENDREDI);
        assertThat(paris.deriveInclusiveFin(VENDREDI, HUIT_HEURES)).isEqualTo(VENDREDI);
        assertThat(casa.deriveInclusiveFin(VENDREDI, SEIZE_HEURES)).isEqualTo(LUNDI);
        assertThat(paris.deriveInclusiveFin(VENDREDI, SEIZE_HEURES)).isEqualTo(LUNDI);
    }

    @Test
    void fuseau_minutesReellesDst_pasLaDifferenceDHorlogeLocale() {
        LocalDate dimancheDst = LocalDate.of(2026, 3, 29);
        CalendrierOuvreCalculator cal = new CalendrierOuvreCalculator(List.of(new CalendrierOuvreCalculator.Version(
                LocalDate.of(1900, 1, 1),
                ZoneId.of("Europe/Paris"),
                List.of(CalendrierOuvreCalculator.Creneau.of(7, LocalTime.of(1, 0), LocalTime.of(4, 0))),
                List.of())));

        assertThat(cal.minutesOuvrees(dimancheDst)).isEqualTo(120);
    }

    @Test
    void shiftNuit_lundi22hMardi06h_huitHeuresFinitMardi() {
        LocalDate lundi = LocalDate.of(2026, 9, 7);
        LocalDate mardi = LocalDate.of(2026, 9, 8);
        CalendrierOuvreCalculator cal = new CalendrierOuvreCalculator(List.of(new CalendrierOuvreCalculator.Version(
                LocalDate.of(1900, 1, 1),
                ZoneId.of(CalendrierOuvreCalculator.FUSEAU_DEFAUT),
                List.of(CalendrierOuvreCalculator.Creneau.nuit(1, LocalTime.of(22, 0), LocalTime.of(6, 0))),
                List.of())));

        assertThat(cal.minutesOuvrees(lundi)).isEqualTo(120);
        assertThat(cal.minutesOuvrees(mardi)).isEqualTo(360);
        assertThat(cal.deriveInclusiveFin(lundi, HUIT_HEURES)).isEqualTo(mardi);
    }

    @Test
    void fermetureMardi_retirePortionNuitCommenceeLundi() {
        LocalDate lundi = LocalDate.of(2026, 9, 7);
        LocalDate mardi = LocalDate.of(2026, 9, 8);
        CalendrierOuvreCalculator cal = new CalendrierOuvreCalculator(List.of(new CalendrierOuvreCalculator.Version(
                LocalDate.of(1900, 1, 1),
                ZoneId.of(CalendrierOuvreCalculator.FUSEAU_DEFAUT),
                List.of(
                        CalendrierOuvreCalculator.Creneau.nuit(1, LocalTime.of(22, 0), LocalTime.of(6, 0)),
                        CalendrierOuvreCalculator.Creneau.of(3, LocalTime.of(8, 0), LocalTime.of(16, 0))),
                List.of(CalendrierOuvreCalculator.ExceptionJour.fermeture(mardi)))));

        assertThat(cal.minutesOuvrees(lundi)).isEqualTo(120);
        assertThat(cal.minutesOuvrees(mardi)).isZero();
        assertThat(cal.deriveInclusiveFin(lundi, HUIT_HEURES)).isEqualTo(LocalDate.of(2026, 9, 9));
    }

    @Test
    void creneauxChevauchants_refus() {
        assertThatThrownBy(() -> new CalendrierOuvreCalculator(List.of(new CalendrierOuvreCalculator.Version(
                LocalDate.of(1900, 1, 1),
                ZoneId.of(CalendrierOuvreCalculator.FUSEAU_DEFAUT),
                List.of(
                        CalendrierOuvreCalculator.Creneau.of(1, LocalTime.of(8, 0), LocalTime.of(16, 0)),
                        CalendrierOuvreCalculator.Creneau.of(1, LocalTime.of(12, 0), LocalTime.of(14, 0))),
                List.of()))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(CalendrierOuvreCalculator.ERR_CHEVAUCHEMENT);
    }

    @Test
    void creneauDureeNulle_refus() {
        assertThatThrownBy(() -> new CalendrierOuvreCalculator(List.of(new CalendrierOuvreCalculator.Version(
                LocalDate.of(1900, 1, 1),
                ZoneId.of(CalendrierOuvreCalculator.FUSEAU_DEFAUT),
                List.of(CalendrierOuvreCalculator.Creneau.of(1, LocalTime.of(8, 0), LocalTime.of(8, 0))),
                List.of()))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(CalendrierOuvreCalculator.ERR_CRENEAU_NUL);
    }

    @Test
    void versionDateEffet_semaineTypeChangeApres() {
        CalendrierOuvreCalculator.Version v1 = new CalendrierOuvreCalculator.Version(
                LocalDate.of(1900, 1, 1),
                ZoneId.of(CalendrierOuvreCalculator.FUSEAU_DEFAUT),
                CalendrierOuvreCalculator.semaineStandardLundiVendredi(),
                List.of());
        CalendrierOuvreCalculator.Version v2 = new CalendrierOuvreCalculator.Version(
                LocalDate.of(2026, 9, 14),
                ZoneId.of(CalendrierOuvreCalculator.FUSEAU_DEFAUT),
                lundiSamediCreneaux(),
                List.of());
        CalendrierOuvreCalculator cal = new CalendrierOuvreCalculator(List.of(v1, v2));

        assertThat(cal.deriveInclusiveFin(VENDREDI, SEIZE_HEURES)).isEqualTo(LUNDI);
        assertThat(cal.deriveInclusiveFin(LocalDate.of(2026, 9, 18), SEIZE_HEURES))
                .isEqualTo(LocalDate.of(2026, 9, 19));
    }

    private static CalendrierOuvreCalculator lundiSamedi(String fuseau) {
        return new CalendrierOuvreCalculator(List.of(new CalendrierOuvreCalculator.Version(
                LocalDate.of(1900, 1, 1),
                ZoneId.of(fuseau),
                lundiSamediCreneaux(),
                List.of())));
    }

    private static List<CalendrierOuvreCalculator.Creneau> lundiSamediCreneaux() {
        return List.of(
                CalendrierOuvreCalculator.Creneau.of(1, LocalTime.of(8, 0), LocalTime.of(16, 0)),
                CalendrierOuvreCalculator.Creneau.of(2, LocalTime.of(8, 0), LocalTime.of(16, 0)),
                CalendrierOuvreCalculator.Creneau.of(3, LocalTime.of(8, 0), LocalTime.of(16, 0)),
                CalendrierOuvreCalculator.Creneau.of(4, LocalTime.of(8, 0), LocalTime.of(16, 0)),
                CalendrierOuvreCalculator.Creneau.of(5, LocalTime.of(8, 0), LocalTime.of(16, 0)),
                CalendrierOuvreCalculator.Creneau.of(6, LocalTime.of(8, 0), LocalTime.of(16, 0)));
    }
}
