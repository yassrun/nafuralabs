package ma.nafura.item.domain;

/**
 * Point unique de correspondance entre :
 * <ul>
 *   <li>types de composant d'ouvrage (bibliothèque) — {@code MATERIAU}, {@code MO}, …</li>
 *   <li>{@link ArticleType} sur le catalogue {@code Item}</li>
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

    /** Types ComposantDpu (décomposition). */
    public static final String DPU_MATIERE = ArticleType.MATIERE;
    public static final String DPU_MAIN_DOEUVRE = ArticleType.MAIN_DOEUVRE;
    public static final String DPU_MATERIEL = ArticleType.MATERIEL;
    public static final String DPU_SOUS_TRAITANCE = ArticleType.SOUS_TRAITANCE;

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

    /** Mappe {@link ArticleType} → type DPU. */
    public static String toDpuTypeFromArticleType(String articleType) {
        String normalized = ArticleType.normalize(articleType);
        if (normalized == null) {
            return DPU_MATIERE;
        }
        return switch (normalized) {
            case ArticleType.MAIN_DOEUVRE -> DPU_MAIN_DOEUVRE;
            case ArticleType.MATERIEL -> DPU_MATERIEL;
            case ArticleType.SOUS_TRAITANCE -> DPU_SOUS_TRAITANCE;
            case ArticleType.SERVICE, ArticleType.CONSOMMABLE, ArticleType.MATIERE -> DPU_MATIERE;
            default -> DPU_MATIERE;
        };
    }

    /** Mappe un type d'ouvrage bibliothèque → {@link ArticleType}. */
    public static String toArticleTypeFromOuvrage(String ouvrageType) {
        if (ouvrageType == null || ouvrageType.isBlank()) {
            return ArticleType.MATIERE;
        }
        return switch (ouvrageType.trim().toUpperCase()) {
            case OUVRAGE_MO -> ArticleType.MAIN_DOEUVRE;
            case OUVRAGE_LOCATION, OUVRAGE_OUTILLAGE -> ArticleType.MATERIEL;
            case OUVRAGE_SOUS_TRAITANCE -> ArticleType.SOUS_TRAITANCE;
            case OUVRAGE_MATERIAU -> ArticleType.MATIERE;
            default -> ArticleType.MATIERE;
        };
    }
}
