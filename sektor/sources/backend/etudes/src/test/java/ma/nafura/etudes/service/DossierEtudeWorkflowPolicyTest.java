package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.domain.dossier.DossierEtudeAction;
import ma.nafura.etudes.domain.dossier.StatutDossierEtude;
import ma.nafura.platform.framework.context.UserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class DossierEtudeWorkflowPolicyTest {

    private static final UUID INGE = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private final DossierEtudeWorkflowPolicy policy = new DossierEtudeWorkflowPolicy();

    @BeforeEach
    void setUp() {
        UserContext.setUserRole("BTP_ADMIN_ETUDE");
        UserContext.setUserId(UUID.fromString("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"));
    }

    @AfterEach
    void tearDown() {
        UserContext.clear();
    }

    @Test
    void draft_vers_assigned_interdit_sans_affectation() {
        DossierEtude dossier = DossierEtude.builder()
                .id(UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd"))
                .status(StatutDossierEtude.DRAFT)
                .build();
        assertThatThrownBy(() -> policy.validateTransition(DossierEtudeAction.ASSIGN_STUDY, dossier))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("etudes.dossier.assign_sans_affectation");
    }

    @Test
    void draft_vers_assigned_autorise_avec_affectation() {
        DossierEtude dossier = dossier(StatutDossierEtude.DRAFT);
        dossier.setChargeEtudeUserId(INGE.toString());
        policy.validateTransition(DossierEtudeAction.ASSIGN_STUDY, dossier);
        assertThat(policy.canExecute(DossierEtudeAction.ASSIGN_STUDY, dossier)).isTrue();
    }

    @Test
    void transitions_nominales() {
        assertCan(StatutDossierEtude.DRAFT, DossierEtudeAction.SUBMIT_FOR_ASSIGNMENT);
        assertCan(pending(), DossierEtudeAction.ASSIGN_STUDY);
        assertCan(pending(), DossierEtudeAction.REJECT_STUDY);
        assertCan(StatutDossierEtude.REJECTED, DossierEtudeAction.RETURN_TO_DRAFT);
        UserContext.setUserRole("BTP_INGENIEUR");
        UserContext.setUserId(INGE);
        assertCan(assigned(), DossierEtudeAction.START_STUDY);
        assertCan(assigned(), DossierEtudeAction.REJECT_BY_STUDY_TEAM);
        assertCan(StatutDossierEtude.STUDY_REJECTED, DossierEtudeAction.RESUME_STUDY);
        assertCan(StatutDossierEtude.IN_PROGRESS, DossierEtudeAction.SUSPEND_STUDY);
        assertCan(StatutDossierEtude.SUSPENDED, DossierEtudeAction.RESUME_STUDY);
        assertCan(StatutDossierEtude.IN_PROGRESS, DossierEtudeAction.COMPLETE_STUDY);
        UserContext.setUserRole("BTP_DAF");
        assertCan(StatutDossierEtude.COMPLETED, DossierEtudeAction.APPROVE_FINANCIALLY);
        assertCan(StatutDossierEtude.COMPLETED, DossierEtudeAction.REJECT_FINANCIALLY);
        UserContext.setUserRole("BTP_INGENIEUR");
        UserContext.setUserId(INGE);
        assertCan(StatutDossierEtude.FINANCIALLY_REJECTED, DossierEtudeAction.RESUME_STUDY);
        UserContext.setUserRole("BTP_ADMIN_ETUDE");
        assertCan(StatutDossierEtude.FINANCIALLY_APPROVED, DossierEtudeAction.APPROVE_FINAL);
        assertCan(StatutDossierEtude.FINANCIALLY_APPROVED, DossierEtudeAction.REJECT_FINAL);
        assertCan(StatutDossierEtude.FINAL_REJECTED, DossierEtudeAction.RESUME_STUDY);
    }

    @Test
    void terminaux_sans_action() {
        assertThat(policy.availableActions(dossier(StatutDossierEtude.FINAL_APPROVED))).isEmpty();
        assertThat(policy.availableActions(dossier(StatutDossierEtude.ARCHIVED))).isEmpty();
    }

    @Test
    void daf_ne_valide_pas_definitivement() {
        UserContext.setUserRole("BTP_DAF");
        assertThatThrownBy(() ->
                        policy.validateTransition(
                                DossierEtudeAction.APPROVE_FINAL,
                                dossier(StatutDossierEtude.FINANCIALLY_APPROVED)))
                .hasMessage("etudes.dossier.go_reserve_dg");
    }

    @Test
    void ingenieurs_non_affecte_ne_demarre_pas() {
        UserContext.setUserRole("BTP_INGENIEUR");
        UserContext.setUserId(UUID.fromString("11111111-1111-1111-1111-111111111111"));
        assertThatThrownBy(() -> policy.validateTransition(DossierEtudeAction.START_STUDY, assigned()))
                .hasMessage("etudes.dossier.accept_reserve_charge");
    }

    private void assertCan(StatutDossierEtude status, DossierEtudeAction action) {
        DossierEtude dossier = dossier(status);
        if (action == DossierEtudeAction.ASSIGN_STUDY && status == StatutDossierEtude.DRAFT) {
            dossier.setChargeEtudeUserId(INGE.toString());
        }
        if (status == StatutDossierEtude.ASSIGNED
                || status == StatutDossierEtude.IN_PROGRESS
                || status == StatutDossierEtude.SUSPENDED
                || status == StatutDossierEtude.STUDY_REJECTED
                || status == StatutDossierEtude.FINANCIALLY_REJECTED
                || status == StatutDossierEtude.FINAL_REJECTED) {
            dossier.setChargeEtudeUserId(INGE.toString());
        }
        policy.validateTransition(action, dossier);
    }

    private void assertCan(DossierEtude dossier, DossierEtudeAction action) {
        policy.validateTransition(action, dossier);
    }

    private static DossierEtude pending() {
        return dossier(StatutDossierEtude.PENDING_ASSIGNMENT);
    }

    private static DossierEtude assigned() {
        DossierEtude d = dossier(StatutDossierEtude.ASSIGNED);
        d.setChargeEtudeUserId(INGE.toString());
        return d;
    }

    private static DossierEtude dossier(StatutDossierEtude status) {
        return DossierEtude.builder()
                .id(UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd"))
                .status(status)
                .chargeEtudeUserId(INGE.toString())
                .build();
    }
}
