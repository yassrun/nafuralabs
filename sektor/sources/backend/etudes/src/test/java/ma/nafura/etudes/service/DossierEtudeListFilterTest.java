package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.UUID;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.domain.dossier.StatutDossierEtude;
import org.junit.jupiter.api.Test;

class DossierEtudeListFilterTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 9, 11);
    private static final String ING = "11111111-1111-1111-1111-111111111111";
    private static final String CLIENT = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

    @Test
    void filtre_statut_et_client() {
        DossierEtude d = dossier(StatutDossierEtude.IN_PROGRESS, CLIENT, ING, TODAY.minusDays(2));

        assertThat(match(d, StatutDossierEtude.IN_PROGRESS, CLIENT, null, null, null, null, null)).isTrue();
        assertThat(match(d, StatutDossierEtude.ASSIGNED, CLIENT, null, null, null, null, null)).isFalse();
        assertThat(match(d, null, "autre", null, null, null, null, null)).isFalse();
    }

    @Test
    void mes_etudes_et_non_affectees() {
        DossierEtude mienne = dossier(StatutDossierEtude.IN_PROGRESS, CLIENT, ING, TODAY.plusDays(3));
        DossierEtude autre = dossier(StatutDossierEtude.IN_PROGRESS, CLIENT, UUID.randomUUID().toString(), TODAY.plusDays(3));
        DossierEtude libre = dossier(StatutDossierEtude.PENDING_ASSIGNMENT, CLIENT, null, TODAY.plusDays(3));

        assertThat(match(mienne, null, null, null, "MOI", null, null, null)).isTrue();
        assertThat(match(autre, null, null, null, "MOI", null, null, null)).isFalse();
        assertThat(match(libre, null, null, null, "MOI", null, null, null)).isFalse();
        assertThat(match(libre, null, null, null, "NON_AFFECTE", null, null, null)).isTrue();
        assertThat(match(mienne, null, null, null, "NON_AFFECTE", null, null, null)).isFalse();
    }

    @Test
    void mes_etudes_inclut_un_lot_delegue() {
        DossierEtude delegue = dossier(StatutDossierEtude.IN_PROGRESS, CLIENT, UUID.randomUUID().toString(), TODAY);
        delegue.setLotChargeUserIds(java.util.List.of(ING));
        DossierEtude autreLot = dossier(StatutDossierEtude.IN_PROGRESS, CLIENT, UUID.randomUUID().toString(), TODAY);
        autreLot.setLotChargeUserIds(java.util.List.of(UUID.randomUUID().toString()));

        assertThat(match(delegue, null, null, null, "MOI", null, null, null)).isTrue();
        assertThat(match(autreLot, null, null, null, "MOI", null, null, null)).isFalse();
        assertThat(DossierEtudeListFilter.estAssigneA(delegue, ING, "qa.ingenieur@nafuralabs.local")).isTrue();
    }

    @Test
    void delai_en_retard_ignore_les_dossiers_clos() {
        DossierEtude ouverte = dossier(StatutDossierEtude.IN_PROGRESS, CLIENT, ING, TODAY.minusDays(1));
        DossierEtude gagnee = dossier(StatutDossierEtude.FINAL_APPROVED, CLIENT, ING, TODAY.minusDays(1));
        DossierEtude aVenir = dossier(StatutDossierEtude.IN_PROGRESS, CLIENT, ING, TODAY.plusDays(2));

        assertThat(match(ouverte, null, null, null, null, "EN_RETARD", null, null)).isTrue();
        assertThat(match(gagnee, null, null, null, null, "EN_RETARD", null, null)).isFalse();
        assertThat(match(aVenir, null, null, null, null, "EN_RETARD", null, null)).isFalse();
    }

    @Test
    void delai_j7_et_ce_mois_et_sans_date() {
        DossierEtude j3 = dossier(StatutDossierEtude.ASSIGNED, CLIENT, ING, TODAY.plusDays(3));
        DossierEtude j10 = dossier(StatutDossierEtude.ASSIGNED, CLIENT, ING, TODAY.plusDays(10));
        DossierEtude moisSuivant = dossier(StatutDossierEtude.ASSIGNED, CLIENT, ING, TODAY.plusMonths(1));
        DossierEtude sans = dossier(StatutDossierEtude.DRAFT, CLIENT, null, null);

        assertThat(match(j3, null, null, null, null, "J7", null, null)).isTrue();
        assertThat(match(j10, null, null, null, null, "J7", null, null)).isFalse();
        assertThat(match(j3, null, null, null, null, "CE_MOIS", null, null)).isTrue();
        assertThat(match(moisSuivant, null, null, null, null, "CE_MOIS", null, null)).isFalse();
        assertThat(match(sans, null, null, null, null, "SANS_DATE", null, null)).isTrue();
        assertThat(match(j3, null, null, null, null, "SANS_DATE", null, null)).isFalse();
    }

    @Test
    void file_attente_exclut_le_chiffrage_en_cours() {
        DossierEtude aAffecter = dossier(StatutDossierEtude.PENDING_ASSIGNMENT, CLIENT, null, TODAY.plusDays(3));
        DossierEtude enChiffrage = dossier(StatutDossierEtude.IN_PROGRESS, CLIENT, ING, TODAY.plusDays(3));

        assertThat(DossierEtudeListFilter.matches(
                aAffecter, null, null, null, null, null, null, null, "OUI", ING, null, TODAY)).isTrue();
        assertThat(DossierEtudeListFilter.matches(
                enChiffrage, null, null, null, null, null, null, null, "OUI", ING, null, TODAY)).isFalse();
    }

    @Test
    void recherche_numero_objet_client() {
        DossierEtude d = dossier(StatutDossierEtude.IN_PROGRESS, CLIENT, ING, TODAY);
        d.setNumero("ET-0142");
        d.setObjet("Réhab. gare Kenitra");
        d.setClientNom("ONCF");

        assertThat(match(d, null, null, null, null, null, null, "0142")).isTrue();
        assertThat(match(d, null, null, null, null, null, null, "kenitra")).isTrue();
        assertThat(match(d, null, null, null, null, null, null, "oncf")).isTrue();
        assertThat(match(d, null, null, null, null, null, null, "casablanca")).isFalse();
    }

    private static boolean match(
            DossierEtude d,
            StatutDossierEtude status,
            String clientId,
            String charge,
            String affectation,
            String delai,
            String aoType,
            String search) {
        return DossierEtudeListFilter.matches(
                d, status, clientId, charge, affectation, delai, aoType, search, null, ING, null, TODAY);
    }

    private static DossierEtude dossier(
            StatutDossierEtude status, String clientId, String charge, LocalDate limite) {
        return DossierEtude.builder()
                .id(UUID.randomUUID())
                .tenantId(UUID.randomUUID())
                .numero("ET-0001")
                .objet("Étude test")
                .status(status)
                .clientId(clientId)
                .clientNom("ONCF")
                .chargeEtudeUserId(charge)
                .aoDateLimiteDepot(limite)
                .aoType("PUBLIC")
                .build();
    }
}
