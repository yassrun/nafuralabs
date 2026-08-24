package ma.nafura.chantiers.domain.budget;

import java.util.List;
import java.util.Locale;

/**
 * Rubrique de déboursé d'un nœud de l'arbre du chantier (AC-1).
 *
 * <p>Les quatre premières sont les quatre types de {@code ComposantDpu}, sous leurs noms
 * d'origine : deux jeux de noms pour une même chose est précisément ce qui a fait perdre la
 * décomposition en route entre l'étude et le chantier.
 *
 * <p>{@link #NON_VENTILE} n'est pas une cinquième nature de coût : c'est la part du déboursé
 * que la décomposition ne couvre pas (poste {@code ESTIME}, poste {@code DECOMPOSE} sans
 * composants — AC-3). Elle existe pour qu'aucun centime ne se perde à la copie (AC-4), et
 * elle n'est jamais une cible d'imputation du réel (AC-10).
 */
public enum RubriqueDebourse {
    MATIERE("Matière"),
    MAIN_DOEUVRE("Main d'œuvre"),
    MATERIEL("Matériel"),
    SOUS_TRAITANCE("Sous-traitance"),
    NON_VENTILE("Non ventilé");

    /** Les quatre rubriques que porte tout nœud (AC-1) — sans la part non ventilée. */
    public static final List<RubriqueDebourse> LES_QUATRE =
            List.of(MATIERE, MAIN_DOEUVRE, MATERIEL, SOUS_TRAITANCE);

    /** Ordre d'affichage : les quatre rubriques, puis la part non ventilée. */
    public static final List<RubriqueDebourse> AFFICHAGE =
            List.of(MATIERE, MAIN_DOEUVRE, MATERIEL, SOUS_TRAITANCE, NON_VENTILE);

    private final String libelle;

    RubriqueDebourse(String libelle) {
        this.libelle = libelle;
    }

    /** Libellé écran, en clair — AC-15. */
    public String libelle() {
        return libelle;
    }

    public boolean estVentilee() {
        return this != NON_VENTILE;
    }

    /**
     * Lit une rubrique demandée par un appelant d'API.
     *
     * @return {@code null} si rien n'est demandé
     * @throws IllegalArgumentException si la valeur n'est pas une rubrique connue
     */
    public static RubriqueDebourse parse(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        for (RubriqueDebourse rubrique : values()) {
            if (rubrique.name().equals(normalized)) {
                return rubrique;
            }
        }
        throw new IllegalArgumentException("chantiers.debourse.rubrique_inconnue: " + value);
    }

    /**
     * Rubrique d'un composant du DPU, à partir de son type (AC-2).
     *
     * <p>Un type vide ou inconnu tombe en {@link #MATIERE} : c'est le comportement déjà en place
     * côté étude, et il vaut mieux une matière visible qu'un composant perdu.
     */
    public static RubriqueDebourse duTypeDpu(String typeComposantDpu) {
        if (typeComposantDpu == null || typeComposantDpu.isBlank()) {
            return MATIERE;
        }
        return switch (typeComposantDpu.trim().toUpperCase(Locale.ROOT)) {
            case "MAIN_DOEUVRE" -> MAIN_DOEUVRE;
            case "MATERIEL" -> MATERIEL;
            case "SOUS_TRAITANCE" -> SOUS_TRAITANCE;
            default -> MATIERE;
        };
    }
}
