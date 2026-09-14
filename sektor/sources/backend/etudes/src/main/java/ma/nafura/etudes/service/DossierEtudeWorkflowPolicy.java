package ma.nafura.etudes.service;

import java.util.ArrayList;
import java.util.List;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.domain.dossier.DossierEtudeAction;
import ma.nafura.etudes.domain.dossier.StatutDossierEtude;
import ma.nafura.platform.framework.context.UserContext;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Validation des transitions et des droits du workflow Étude.
 *
 * <p>Rôles métier (codes IAM existants, pas de nouveaux rôles globaux) :
 * STUDY_COORDINATOR → {@code BTP_ASSISTANT_ETUDE} ;
 * STUDY_MANAGER → {@code BTP_ADMIN_ETUDE} / {@code BTP_DG} ;
 * BTP_ENGINEER → {@code BTP_INGENIEUR} ;
 * FINANCIAL_APPROVER → {@code BTP_DAF}.
 */
@Component
public class DossierEtudeWorkflowPolicy {

    public static boolean hasActiveStudyAssignments(DossierEtude dossier) {
        return dossier != null && StringUtils.hasText(dossier.getChargeEtudeUserId());
    }

    public boolean canExecute(DossierEtudeAction action, DossierEtude dossier) {
        if (action == null || dossier == null || dossier.getStatus() == null) {
            return false;
        }
        try {
            validateTransition(action, dossier);
            return true;
        } catch (IllegalStateException | IllegalArgumentException ex) {
            return false;
        }
    }

    public void validateTransition(DossierEtudeAction action, DossierEtude dossier) {
        if (action == null) {
            throw new IllegalArgumentException("etudes.dossier.action_requise");
        }
        if (dossier == null || dossier.getStatus() == null) {
            throw new IllegalStateException("etudes.dossier.introuvable");
        }
        StatutDossierEtude source = dossier.getStatus();
        StatutDossierEtude cible = action.statutCible();
        if (action == DossierEtudeAction.ASSIGN_STUDY
                && source == StatutDossierEtude.DRAFT
                && !hasActiveStudyAssignments(dossier)) {
            throw new IllegalStateException("etudes.dossier.assign_sans_affectation");
        }
        if (!source.peutTransitionnerVers(cible)) {
            throw new IllegalStateException("etudes.dossier.transition_interdite");
        }
        assertRoleEtAffectation(action, dossier);
    }

    public List<DossierEtudeAction> availableActions(DossierEtude dossier) {
        List<DossierEtudeAction> out = new ArrayList<>();
        if (dossier == null) {
            return List.of();
        }
        for (DossierEtudeAction action : DossierEtudeAction.values()) {
            if (canExecute(action, dossier)) {
                out.add(action);
            }
        }
        return List.copyOf(out);
    }

    public List<String> availableActionCodes(DossierEtude dossier) {
        return availableActions(dossier).stream().map(Enum::name).toList();
    }

    public boolean estStudyCoordinator() {
        return estOwner() || roleEst("BTP_ASSISTANT_ETUDE", "BTP_ADMIN_ETUDE");
    }

    public boolean estStudyManager() {
        return estOwner() || roleEst("BTP_ADMIN_ETUDE", "BTP_DG");
    }

    public boolean estFinancialApprover() {
        return estOwner() || roleEst("BTP_DAF");
    }

    public boolean estEngineer() {
        return estOwner() || roleEst("BTP_INGENIEUR");
    }

    public boolean peutDeciderAffectation() {
        return estStudyManager();
    }

    /** Alias historique : le GO était réservé au DG. */
    public boolean peutDeciderGo() {
        return peutDeciderAffectation();
    }

    private void assertRoleEtAffectation(DossierEtudeAction action, DossierEtude dossier) {
        if (estOwner()) {
            if (action == DossierEtudeAction.START_STUDY
                    || action == DossierEtudeAction.REJECT_BY_STUDY_TEAM) {
                if (!estChargeEtudeCourant(dossier) && !estStudyManager()) {
                    throw new IllegalStateException(messageReserve(action));
                }
            }
            return;
        }
        switch (action) {
            case SUBMIT_FOR_ASSIGNMENT, RETURN_TO_DRAFT -> {
                if (!estStudyCoordinator() && !estStudyManager()) {
                    throw new IllegalStateException("etudes.dossier.action_reservee_gestionnaire");
                }
            }
            case ASSIGN_STUDY -> {
                boolean reuseDraft = dossier.getStatus() == StatutDossierEtude.DRAFT;
                if (reuseDraft && (estStudyCoordinator() || estStudyManager())) {
                    return;
                }
                if (!estStudyManager()) {
                    throw new IllegalStateException("etudes.dossier.go_reserve_dg");
                }
            }
            case REJECT_STUDY, APPROVE_FINAL, REJECT_FINAL -> {
                if (!estStudyManager()) {
                    throw new IllegalStateException("etudes.dossier.go_reserve_dg");
                }
            }
            case START_STUDY -> {
                if (!estChargeEtudeCourant(dossier)) {
                    throw new IllegalStateException("etudes.dossier.accept_reserve_charge");
                }
            }
            case REJECT_BY_STUDY_TEAM -> {
                if (!estChargeEtudeCourant(dossier)) {
                    throw new IllegalStateException("etudes.dossier.refus_reserve_charge");
                }
            }
            case SUSPEND_STUDY, COMPLETE_STUDY -> {
                if (!estChargeEtudeCourant(dossier) && !estStudyManager()) {
                    throw new IllegalStateException("etudes.dossier.saisie_reservee_charge");
                }
            }
            case RESUME_STUDY -> {
                if (!estChargeEtudeCourant(dossier)
                        && !estStudyManager()
                        && !estStudyCoordinator()) {
                    throw new IllegalStateException("etudes.dossier.saisie_reservee_charge");
                }
            }
            case APPROVE_FINANCIALLY, REJECT_FINANCIALLY -> {
                if (!estFinancialApprover()) {
                    throw new IllegalStateException("etudes.dossier.validation_financiere_reservee");
                }
            }
            case ARCHIVE_STUDY -> {
                boolean brouillonOuRejet =
                        dossier.getStatus() == StatutDossierEtude.DRAFT
                                || dossier.getStatus() == StatutDossierEtude.REJECTED;
                if (brouillonOuRejet && (estStudyCoordinator() || estStudyManager())) {
                    return;
                }
                if (!estStudyManager()) {
                    throw new IllegalStateException("etudes.dossier.archive_reserve_responsable");
                }
            }
        }
    }

    private static String messageReserve(DossierEtudeAction action) {
        return switch (action) {
            case START_STUDY -> "etudes.dossier.accept_reserve_charge";
            case REJECT_BY_STUDY_TEAM -> "etudes.dossier.refus_reserve_charge";
            default -> "etudes.dossier.transition_interdite";
        };
    }

    public boolean estChargeEtudeCourant(DossierEtude dossier) {
        return estMemeActeur(dossier != null ? dossier.getChargeEtudeUserId() : null);
    }

    public boolean estResponsableExecutionCourant(DossierEtude dossier) {
        return estMemeActeur(dossier != null ? dossier.getResponsableExecutionUserId() : null);
    }

    public void assertPeutSaisirApresGo(DossierEtude dossier) {
        if (dossier == null
                || (dossier.getStatus() != StatutDossierEtude.IN_PROGRESS
                        && dossier.getStatus() != StatutDossierEtude.SUSPENDED
                        && dossier.getStatus() != StatutDossierEtude.STUDY_REJECTED)) {
            return;
        }
        if (estStudyManager() || estChargeEtudeCourant(dossier)) {
            return;
        }
        throw new IllegalStateException("etudes.dossier.saisie_reservee_charge");
    }

    public void assertPeutAvisExecution(DossierEtude dossier) {
        if (estStudyManager() || estResponsableExecutionCourant(dossier)) {
            return;
        }
        throw new IllegalStateException("etudes.dossier.avis_reserve_execution");
    }

    public void assertPeutAffecterLots(DossierEtude dossier) {
        if (estStudyManager() || estChargeEtudeCourant(dossier)) {
            return;
        }
        throw new IllegalStateException("etudes.lot.affectation_reservee_charge");
    }

    public boolean estActeurCourant(String identifiant) {
        return estMemeActeur(identifiant);
    }

    private static boolean estOwner() {
        return UserContext.isOwnerOrSuperAdmin();
    }

    private static boolean roleEst(String... roles) {
        String role = UserContext.getUserRole();
        if (role == null) {
            return false;
        }
        for (String attendu : roles) {
            if (attendu.equalsIgnoreCase(role)) {
                return true;
            }
        }
        return false;
    }

    private boolean estMemeActeur(String identifiant) {
        if (!StringUtils.hasText(identifiant)) {
            return false;
        }
        String cle = identifiant.trim();
        var userId = UserContext.getUserIdOrNull();
        if (userId != null && cle.equalsIgnoreCase(userId.toString())) {
            return true;
        }
        String email = UserContext.getUserEmail();
        return StringUtils.hasText(email) && cle.equalsIgnoreCase(email.trim());
    }
}
