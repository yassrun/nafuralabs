package ma.nafura.etudes.domain.model;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Cycle de vie d'un dossier d'étude.
 *
 * <p>Les transitions vivent ici, pas éparpillées en {@code if (status.equals(...))} dans les
 * services. C'était le défaut du module {@code consultation} supprimé : la règle de
 * verrouillage y était dupliquée dans deux services, avec des listes de statuts légèrement
 * différentes.
 *
 * <pre>
 * BROUILLON → EN_ETUDE → EN_VALIDATION → VALIDEE → DEVIS_GENERE → GAGNE → CONVERTIE
 *                  ↑           │                                    ↘
 *                  └── refus ──┘                                     PERDU
 * </pre>
 */
public enum StatutDossierEtude {
    BROUILLON,
    EN_ETUDE,
    EN_VALIDATION,
    VALIDEE,
    DEVIS_GENERE,
    GAGNE,
    PERDU,
    CONVERTIE,
    ANNULE;

    private static final Map<StatutDossierEtude, Set<StatutDossierEtude>> TRANSITIONS = Map.of(
            BROUILLON, EnumSet.of(EN_ETUDE, ANNULE),
            EN_ETUDE, EnumSet.of(EN_VALIDATION, BROUILLON, ANNULE),
            EN_VALIDATION, EnumSet.of(VALIDEE, EN_ETUDE, ANNULE),
            VALIDEE, EnumSet.of(DEVIS_GENERE, EN_ETUDE, ANNULE),
            DEVIS_GENERE, EnumSet.of(GAGNE, PERDU, ANNULE),
            GAGNE, EnumSet.of(CONVERTIE),
            PERDU, EnumSet.noneOf(StatutDossierEtude.class),
            CONVERTIE, EnumSet.noneOf(StatutDossierEtude.class),
            ANNULE, EnumSet.noneOf(StatutDossierEtude.class));

    /**
     * Le contenu de l'étude (arbre, décomposition, chiffrage) est-il modifiable ?
     *
     * <p>Une étude validée ne se modifie pas en place : on repart d'une nouvelle version
     * (cf. {@code DpuVersion}).
     */
    public boolean estModifiable() {
        return this == BROUILLON || this == EN_ETUDE;
    }

    public boolean peutTransitionnerVers(StatutDossierEtude cible) {
        return TRANSITIONS.getOrDefault(this, Set.of()).contains(cible);
    }

    /** États terminaux — plus aucune transition possible. */
    public boolean estTerminal() {
        return TRANSITIONS.getOrDefault(this, Set.of()).isEmpty();
    }
}
