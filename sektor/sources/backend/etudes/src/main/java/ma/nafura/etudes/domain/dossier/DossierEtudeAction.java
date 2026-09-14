package ma.nafura.etudes.domain.dossier;

/**
 * Actions métier explicites du workflow Étude. Le client ne choisit jamais le statut cible.
 */
public enum DossierEtudeAction {
    SUBMIT_FOR_ASSIGNMENT,
    ASSIGN_STUDY,
    REJECT_STUDY,
    RETURN_TO_DRAFT,
    START_STUDY,
    REJECT_BY_STUDY_TEAM,
    RESUME_STUDY,
    SUSPEND_STUDY,
    COMPLETE_STUDY,
    APPROVE_FINANCIALLY,
    REJECT_FINANCIALLY,
    APPROVE_FINAL,
    REJECT_FINAL,
    ARCHIVE_STUDY;

    public StatutDossierEtude statutCible() {
        return switch (this) {
            case SUBMIT_FOR_ASSIGNMENT -> StatutDossierEtude.PENDING_ASSIGNMENT;
            case ASSIGN_STUDY -> StatutDossierEtude.ASSIGNED;
            case REJECT_STUDY -> StatutDossierEtude.REJECTED;
            case RETURN_TO_DRAFT -> StatutDossierEtude.DRAFT;
            case START_STUDY -> StatutDossierEtude.IN_PROGRESS;
            case REJECT_BY_STUDY_TEAM -> StatutDossierEtude.STUDY_REJECTED;
            case RESUME_STUDY -> StatutDossierEtude.IN_PROGRESS;
            case SUSPEND_STUDY -> StatutDossierEtude.SUSPENDED;
            case COMPLETE_STUDY -> StatutDossierEtude.COMPLETED;
            case APPROVE_FINANCIALLY -> StatutDossierEtude.FINANCIALLY_APPROVED;
            case REJECT_FINANCIALLY -> StatutDossierEtude.FINANCIALLY_REJECTED;
            case APPROVE_FINAL -> StatutDossierEtude.FINAL_APPROVED;
            case REJECT_FINAL -> StatutDossierEtude.FINAL_REJECTED;
            case ARCHIVE_STUDY -> StatutDossierEtude.ARCHIVED;
        };
    }
}
