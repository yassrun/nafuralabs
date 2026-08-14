package ma.nafura.catalogue.domain.article;

/**
 * Point unique de correspondance entre :
 * <ul>
 *   <li>types de composant d'ouvrage (bibliothèque) — {@code MATERIAU}, {@code MO}, …</li>
 *   <li>{@link Nature} sur le catalogue {@code Item}</li>
 *   <li>types de décomposition DPU — {@code MATIERE}, {@code MAIN_DOEUVRE}, …</li>
 * </ul>
 * Remplace le switch privé historique de {@code DpuService.mapOuvrageTypeToDpu()}.
 */
public final class NatureComposantMapping {

    /** Types ComposantOuvrage (bibliothèque). */
    public static final String OUVRAGE_MATERIAU = "MATERIAU";
    public static final String OUVRAGE_MO = "MO";
    public static final String OUVRAGE_LOCATION = "LOCATION";
    public static final String OUVRAGE_OUTILLAGE = "OUTILLAGE";
    public static final String OUVRAGE_SOUS_TRAITANCE = "SOUS_TRAITANCE";

    /** Types ComposantDpu (décomposition) — 4 postes. */
    public static final String DPU_MATIERE = "MATIERE";
    public static final String DPU_MAIN_DOEUVRE = "MAIN_DOEUVRE";
    public static final String DPU_MATERIEL = "MATERIEL";
    public static final String DPU_SOUS_TRAITANCE = "SOUS_TRAITANCE";

    private NatureComposantMapping() {}

    /**
     * Mappe un type de composant d'ouvrage vers le type DPU.
     * Même sémantique que l'ancien {@code DpuService.mapOuvrageTypeToDpu()}.
     */
    public static String toDpuTypeFromOuvrage(String ouvrageType) {
        if (ouvrageType == null || ouvrageType.isBlank()) {
            return DPU_MATIERE;
        }
        return switch (ouvrageType.trim().toUpperCase()) {
            case OUVRAGE_MO -> DPU_MAIN_DOEUVRE;
            case OUVRAGE_LOCATION, OUVRAGE_OUTILLAGE -> DPU_MATERIEL;
            case OUVRAGE_SOUS_TRAITANCE -> DPU_SOUS_TRAITANCE;
            default -> DPU_MATIERE;
        };
    }

    /** Mappe un type DPU → type composant ouvrage (bibliothèque). */
    public static String toOuvrageTypeFromDpu(String dpuType) {
        if (dpuType == null || dpuType.isBlank()) {
            return OUVRAGE_MATERIAU;
        }
        return switch (dpuType.trim().toUpperCase()) {
            case DPU_MAIN_DOEUVRE -> OUVRAGE_MO;
            case DPU_MATERIEL -> OUVRAGE_LOCATION;
            case DPU_SOUS_TRAITANCE -> OUVRAGE_SOUS_TRAITANCE;
            default -> OUVRAGE_MATERIAU;
        };
    }

    /** Mappe {@link Nature} (code stocké) → type DPU. */
    public static String toDpuTypeFromNature(String natureCode) {
        Nature nature = Nature.fromLegacy(natureCode);
        if (nature == null) {
            return DPU_MATIERE;
        }
        return nature.getTypeDpu();
    }

    /** @deprecated use {@link #toDpuTypeFromNature(String)} */
    @Deprecated(since = "classification-lot1", forRemoval = true)
    public static String toDpuTypeFromArticleType(String articleType) {
        return toDpuTypeFromNature(articleType);
    }

    /** Mappe un type d'ouvrage bibliothèque → {@link Nature} (code). */
    public static String toNatureFromOuvrage(String ouvrageType) {
        if (ouvrageType == null || ouvrageType.isBlank()) {
            return Nature.MATIERE.name();
        }
        return switch (ouvrageType.trim().toUpperCase()) {
            case OUVRAGE_MO -> Nature.MAIN_DOEUVRE.name();
            case OUVRAGE_LOCATION -> Nature.LOCATION.name();
            case OUVRAGE_OUTILLAGE -> Nature.OUTILLAGE.name();
            case OUVRAGE_SOUS_TRAITANCE -> Nature.SOUS_TRAITANCE.name();
            case OUVRAGE_MATERIAU -> Nature.MATIERE.name();
            default -> Nature.MATIERE.name();
        };
    }

    /** @deprecated use {@link #toNatureFromOuvrage(String)} */
    @Deprecated(since = "classification-lot1", forRemoval = true)
    public static String toArticleTypeFromOuvrage(String ouvrageType) {
        return toNatureFromOuvrage(ouvrageType);
    }
}
