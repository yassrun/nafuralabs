package ma.nafura.etudes.domain.dossier;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Cycle de vie d'un dossier d'étude (BC Étude uniquement).
 *
 * <p>Hors périmètre : négociation commerciale, Gagné / Perdu, devis après validation,
 * chantier. {@link #FINAL_APPROVED} est le terminal positif ; {@link #ARCHIVED} le
 * terminal d'abandon.
 */
public enum StatutDossierEtude {
    DRAFT,
    PENDING_ASSIGNMENT,
    REJECTED,
    ASSIGNED,
    STUDY_REJECTED,
    IN_PROGRESS,
    SUSPENDED,
    COMPLETED,
    FINANCIALLY_APPROVED,
    FINANCIALLY_REJECTED,
    FINAL_APPROVED,
    FINAL_REJECTED,
    ARCHIVED;

    private static final Map<StatutDossierEtude, Set<StatutDossierEtude>> TRANSITIONS = Map.ofEntries(
            Map.entry(DRAFT, EnumSet.of(PENDING_ASSIGNMENT, ASSIGNED, ARCHIVED)),
            Map.entry(PENDING_ASSIGNMENT, EnumSet.of(ASSIGNED, REJECTED, ARCHIVED)),
            Map.entry(REJECTED, EnumSet.of(DRAFT, ARCHIVED)),
            Map.entry(ASSIGNED, EnumSet.of(IN_PROGRESS, STUDY_REJECTED, ARCHIVED)),
            Map.entry(STUDY_REJECTED, EnumSet.of(IN_PROGRESS, ARCHIVED)),
            Map.entry(IN_PROGRESS, EnumSet.of(SUSPENDED, COMPLETED, ARCHIVED)),
            Map.entry(SUSPENDED, EnumSet.of(IN_PROGRESS, ARCHIVED)),
            Map.entry(COMPLETED, EnumSet.of(FINANCIALLY_APPROVED, FINANCIALLY_REJECTED, ARCHIVED)),
            Map.entry(FINANCIALLY_REJECTED, EnumSet.of(IN_PROGRESS, ARCHIVED)),
            Map.entry(FINANCIALLY_APPROVED, EnumSet.of(FINAL_APPROVED, FINAL_REJECTED, ARCHIVED)),
            Map.entry(FINAL_REJECTED, EnumSet.of(IN_PROGRESS, ARCHIVED)),
            Map.entry(FINAL_APPROVED, EnumSet.noneOf(StatutDossierEtude.class)),
            Map.entry(ARCHIVED, EnumSet.noneOf(StatutDossierEtude.class)));

    public boolean estModifiable() {
        return this == DRAFT
                || this == PENDING_ASSIGNMENT
                || this == IN_PROGRESS
                || this == STUDY_REJECTED;
    }

    public boolean enAttenteAffectation() {
        return this == DRAFT || this == PENDING_ASSIGNMENT;
    }

    /** @deprecated préférer {@link #enAttenteAffectation()} */
    @Deprecated
    public boolean enAttenteGo() {
        return enAttenteAffectation();
    }

    public boolean peutTransitionnerVers(StatutDossierEtude cible) {
        return TRANSITIONS.getOrDefault(this, Set.of()).contains(cible);
    }

    public boolean estTerminal() {
        return this == FINAL_APPROVED || this == ARCHIVED;
    }

    public boolean estClosPourDelai() {
        return this == FINAL_APPROVED || this == ARCHIVED || this == REJECTED;
    }
}
