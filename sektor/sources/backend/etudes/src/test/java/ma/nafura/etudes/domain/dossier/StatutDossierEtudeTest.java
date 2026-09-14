package ma.nafura.etudes.domain.dossier;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class StatutDossierEtudeTest {

    @Test
    void seuls_draft_pending_in_progress_et_study_rejected_sont_modifiables() {
        assertThat(StatutDossierEtude.DRAFT.estModifiable()).isTrue();
        assertThat(StatutDossierEtude.PENDING_ASSIGNMENT.estModifiable()).isTrue();
        assertThat(StatutDossierEtude.IN_PROGRESS.estModifiable()).isTrue();
        assertThat(StatutDossierEtude.STUDY_REJECTED.estModifiable()).isTrue();
        assertThat(StatutDossierEtude.ASSIGNED.estModifiable()).isFalse();

        for (StatutDossierEtude s : StatutDossierEtude.values()) {
            if (s != StatutDossierEtude.DRAFT
                    && s != StatutDossierEtude.PENDING_ASSIGNMENT
                    && s != StatutDossierEtude.IN_PROGRESS
                    && s != StatutDossierEtude.STUDY_REJECTED) {
                assertThat(s.estModifiable())
                        .as("%s ne doit pas être modifiable", s)
                        .isFalse();
            }
        }
    }

    @Test
    void matrice_officielle() {
        assertThat(StatutDossierEtude.DRAFT.peutTransitionnerVers(StatutDossierEtude.PENDING_ASSIGNMENT)).isTrue();
        assertThat(StatutDossierEtude.DRAFT.peutTransitionnerVers(StatutDossierEtude.ASSIGNED)).isTrue();
        assertThat(StatutDossierEtude.DRAFT.peutTransitionnerVers(StatutDossierEtude.ARCHIVED)).isTrue();

        assertThat(StatutDossierEtude.PENDING_ASSIGNMENT.peutTransitionnerVers(StatutDossierEtude.ASSIGNED)).isTrue();
        assertThat(StatutDossierEtude.PENDING_ASSIGNMENT.peutTransitionnerVers(StatutDossierEtude.REJECTED)).isTrue();
        assertThat(StatutDossierEtude.PENDING_ASSIGNMENT.peutTransitionnerVers(StatutDossierEtude.ARCHIVED)).isTrue();

        assertThat(StatutDossierEtude.REJECTED.peutTransitionnerVers(StatutDossierEtude.DRAFT)).isTrue();
        assertThat(StatutDossierEtude.REJECTED.peutTransitionnerVers(StatutDossierEtude.ARCHIVED)).isTrue();

        assertThat(StatutDossierEtude.ASSIGNED.peutTransitionnerVers(StatutDossierEtude.IN_PROGRESS)).isTrue();
        assertThat(StatutDossierEtude.ASSIGNED.peutTransitionnerVers(StatutDossierEtude.STUDY_REJECTED)).isTrue();
        assertThat(StatutDossierEtude.ASSIGNED.peutTransitionnerVers(StatutDossierEtude.ARCHIVED)).isTrue();

        assertThat(StatutDossierEtude.STUDY_REJECTED.peutTransitionnerVers(StatutDossierEtude.IN_PROGRESS)).isTrue();
        assertThat(StatutDossierEtude.STUDY_REJECTED.peutTransitionnerVers(StatutDossierEtude.DRAFT)).isFalse();

        assertThat(StatutDossierEtude.IN_PROGRESS.peutTransitionnerVers(StatutDossierEtude.SUSPENDED)).isTrue();
        assertThat(StatutDossierEtude.IN_PROGRESS.peutTransitionnerVers(StatutDossierEtude.COMPLETED)).isTrue();
        assertThat(StatutDossierEtude.SUSPENDED.peutTransitionnerVers(StatutDossierEtude.IN_PROGRESS)).isTrue();

        assertThat(StatutDossierEtude.COMPLETED.peutTransitionnerVers(StatutDossierEtude.FINANCIALLY_APPROVED)).isTrue();
        assertThat(StatutDossierEtude.COMPLETED.peutTransitionnerVers(StatutDossierEtude.FINANCIALLY_REJECTED)).isTrue();
        assertThat(StatutDossierEtude.FINANCIALLY_REJECTED.peutTransitionnerVers(StatutDossierEtude.IN_PROGRESS)).isTrue();
        assertThat(StatutDossierEtude.FINANCIALLY_APPROVED.peutTransitionnerVers(StatutDossierEtude.FINAL_APPROVED)).isTrue();
        assertThat(StatutDossierEtude.FINANCIALLY_APPROVED.peutTransitionnerVers(StatutDossierEtude.FINAL_REJECTED)).isTrue();
        assertThat(StatutDossierEtude.FINAL_REJECTED.peutTransitionnerVers(StatutDossierEtude.IN_PROGRESS)).isTrue();
    }

    @Test
    void sauts_interdits() {
        assertThat(StatutDossierEtude.IN_PROGRESS.peutTransitionnerVers(StatutDossierEtude.FINANCIALLY_APPROVED))
                .isFalse();
        assertThat(StatutDossierEtude.DRAFT.peutTransitionnerVers(StatutDossierEtude.COMPLETED)).isFalse();
        assertThat(StatutDossierEtude.COMPLETED.peutTransitionnerVers(StatutDossierEtude.FINAL_APPROVED)).isFalse();
        assertThat(StatutDossierEtude.ASSIGNED.peutTransitionnerVers(StatutDossierEtude.DRAFT)).isFalse();
    }

    @Test
    void terminaux() {
        assertThat(StatutDossierEtude.FINAL_APPROVED.estTerminal()).isTrue();
        assertThat(StatutDossierEtude.ARCHIVED.estTerminal()).isTrue();
        assertThat(StatutDossierEtude.FINAL_APPROVED.peutTransitionnerVers(StatutDossierEtude.IN_PROGRESS)).isFalse();
        assertThat(StatutDossierEtude.ARCHIVED.peutTransitionnerVers(StatutDossierEtude.DRAFT)).isFalse();
        for (StatutDossierEtude cible : StatutDossierEtude.values()) {
            assertThat(StatutDossierEtude.FINAL_APPROVED.peutTransitionnerVers(cible))
                    .as("FINAL_APPROVED → %s", cible)
                    .isFalse();
            assertThat(StatutDossierEtude.ARCHIVED.peutTransitionnerVers(cible))
                    .as("ARCHIVED → %s", cible)
                    .isFalse();
        }
    }

    @Test
    void won_lost_ne_sont_plus_des_statuts() {
        for (StatutDossierEtude s : StatutDossierEtude.values()) {
            assertThat(s.name()).isNotIn("GAGNE", "PERDU", "WON", "LOST", "CONVERTIE", "DEVIS_GENERE");
        }
    }
}
