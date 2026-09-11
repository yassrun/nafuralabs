package ma.nafura.etudes.domain.dossier;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Cycle de vie d'un dossier d'étude.
 *
 * <pre>
 * BROUILLON → A_DECIDER → AFFECTE → EN_ETUDE ⇄ SUSPENDU → [A_AVIS_EXECUTION] → EN_VALIDATION → …
 *      │           │          │          │
 *      └ archive    ├ archive  └ REJETE_CHIFFRAGE ⇄ AFFECTE
 *                                └ BROUILLON (réinitialiser)
 *                   └ NE_PAS_ETUDIER → ANNULE
 * </pre>
 */
public enum StatutDossierEtude {
    BROUILLON,
    A_DECIDER,
    AFFECTE,
    EN_ETUDE,
    A_AVIS_EXECUTION,
    EN_VALIDATION,
    VALIDEE,
    DEVIS_GENERE,
    GAGNE,
    PERDU,
    CONVERTIE,
    ANNULE,
    NE_PAS_ETUDIER,
    REJETE_CHIFFRAGE,
    SUSPENDU;

    private static final Map<StatutDossierEtude, Set<StatutDossierEtude>> TRANSITIONS = Map.ofEntries(
            Map.entry(BROUILLON, EnumSet.of(A_DECIDER, AFFECTE, ANNULE, NE_PAS_ETUDIER)),
            Map.entry(A_DECIDER, EnumSet.of(AFFECTE, BROUILLON, ANNULE, NE_PAS_ETUDIER)),
            Map.entry(AFFECTE, EnumSet.of(EN_ETUDE, REJETE_CHIFFRAGE)),
            Map.entry(EN_ETUDE, EnumSet.of(EN_VALIDATION, A_AVIS_EXECUTION, SUSPENDU, BROUILLON, ANNULE)),
            Map.entry(A_AVIS_EXECUTION, EnumSet.of(EN_VALIDATION, EN_ETUDE, ANNULE)),
            Map.entry(EN_VALIDATION, EnumSet.of(VALIDEE, EN_ETUDE, ANNULE)),
            Map.entry(VALIDEE, EnumSet.of(DEVIS_GENERE, EN_ETUDE, ANNULE)),
            Map.entry(DEVIS_GENERE, EnumSet.of(GAGNE, PERDU, ANNULE)),
            Map.entry(GAGNE, EnumSet.of(CONVERTIE)),
            Map.entry(PERDU, EnumSet.noneOf(StatutDossierEtude.class)),
            Map.entry(CONVERTIE, EnumSet.noneOf(StatutDossierEtude.class)),
            Map.entry(ANNULE, EnumSet.noneOf(StatutDossierEtude.class)),
            Map.entry(NE_PAS_ETUDIER, EnumSet.of(ANNULE)),
            Map.entry(REJETE_CHIFFRAGE, EnumSet.of(AFFECTE, BROUILLON, ANNULE)),
            Map.entry(SUSPENDU, EnumSet.of(EN_ETUDE, EN_VALIDATION, A_AVIS_EXECUTION)));

    public boolean estModifiable() {
        return this == BROUILLON
                || this == A_DECIDER
                || this == EN_ETUDE
                || this == REJETE_CHIFFRAGE;
    }

    public boolean enAttenteGo() {
        return this == BROUILLON || this == A_DECIDER;
    }

    public boolean peutTransitionnerVers(StatutDossierEtude cible) {
        return TRANSITIONS.getOrDefault(this, Set.of()).contains(cible);
    }

    public boolean estTerminal() {
        return TRANSITIONS.getOrDefault(this, Set.of()).isEmpty();
    }
}
