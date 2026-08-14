package ma.nafura.etudes.domain.model;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/**
 * Verrouille le cycle de vie du dossier d'étude.
 *
 * <p>Ces règles étaient dupliquées dans deux services du module {@code consultation}, avec des
 * listes de statuts divergentes. Les regrouper dans l'enum n'a d'intérêt que si on les teste.
 */
class StatutDossierEtudeTest {

    @Test
    void seuls_brouillon_et_en_etude_sont_modifiables() {
        assertThat(StatutDossierEtude.BROUILLON.estModifiable()).isTrue();
        assertThat(StatutDossierEtude.EN_ETUDE.estModifiable()).isTrue();

        for (StatutDossierEtude s : StatutDossierEtude.values()) {
            if (s != StatutDossierEtude.BROUILLON && s != StatutDossierEtude.EN_ETUDE) {
                assertThat(s.estModifiable())
                        .as("%s ne doit pas être modifiable", s)
                        .isFalse();
            }
        }
    }

    @Test
    void parcours_nominal_jusqua_conversion() {
        assertThat(StatutDossierEtude.BROUILLON.peutTransitionnerVers(StatutDossierEtude.EN_ETUDE)).isTrue();
        assertThat(StatutDossierEtude.EN_ETUDE.peutTransitionnerVers(StatutDossierEtude.EN_VALIDATION)).isTrue();
        assertThat(StatutDossierEtude.EN_VALIDATION.peutTransitionnerVers(StatutDossierEtude.VALIDEE)).isTrue();
        assertThat(StatutDossierEtude.VALIDEE.peutTransitionnerVers(StatutDossierEtude.DEVIS_GENERE)).isTrue();
        assertThat(StatutDossierEtude.DEVIS_GENERE.peutTransitionnerVers(StatutDossierEtude.GAGNE)).isTrue();
        assertThat(StatutDossierEtude.GAGNE.peutTransitionnerVers(StatutDossierEtude.CONVERTIE)).isTrue();
    }

    @Test
    void refus_renvoie_en_etude() {
        assertThat(StatutDossierEtude.EN_VALIDATION.peutTransitionnerVers(StatutDossierEtude.EN_ETUDE)).isTrue();
    }

    @Test
    void on_ne_saute_pas_la_validation() {
        assertThat(StatutDossierEtude.EN_ETUDE.peutTransitionnerVers(StatutDossierEtude.VALIDEE)).isFalse();
        assertThat(StatutDossierEtude.BROUILLON.peutTransitionnerVers(StatutDossierEtude.EN_VALIDATION)).isFalse();
        assertThat(StatutDossierEtude.EN_ETUDE.peutTransitionnerVers(StatutDossierEtude.DEVIS_GENERE)).isFalse();
    }

    @Test
    void etats_terminaux_ne_transitionnent_plus() {
        assertThat(StatutDossierEtude.PERDU.estTerminal()).isTrue();
        assertThat(StatutDossierEtude.CONVERTIE.estTerminal()).isTrue();
        assertThat(StatutDossierEtude.ANNULE.estTerminal()).isTrue();
        assertThat(StatutDossierEtude.GAGNE.estTerminal()).isFalse();
    }

    @Test
    void une_affaire_perdue_ne_devient_pas_gagnee() {
        assertThat(StatutDossierEtude.PERDU.peutTransitionnerVers(StatutDossierEtude.GAGNE)).isFalse();
    }

    @Test
    void annulation_possible_tant_que_l_affaire_n_est_pas_close() {
        assertThat(StatutDossierEtude.BROUILLON.peutTransitionnerVers(StatutDossierEtude.ANNULE)).isTrue();
        assertThat(StatutDossierEtude.EN_ETUDE.peutTransitionnerVers(StatutDossierEtude.ANNULE)).isTrue();
        assertThat(StatutDossierEtude.VALIDEE.peutTransitionnerVers(StatutDossierEtude.ANNULE)).isTrue();
        assertThat(StatutDossierEtude.CONVERTIE.peutTransitionnerVers(StatutDossierEtude.ANNULE)).isFalse();
    }
}
