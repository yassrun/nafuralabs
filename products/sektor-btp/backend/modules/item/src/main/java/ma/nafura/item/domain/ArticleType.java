package ma.nafura.item.domain;

/**
 * Nature d'article élémentaire ({@code Item.articleType}).
 * Aligné avec les types de décomposition ({@code ComposantDpu.type}) via
 * {@link NatureComposantMapping}.
 */
public final class ArticleType {

    public static final String MATIERE = "MATIERE";
    public static final String CONSOMMABLE = "CONSOMMABLE";
    public static final String MATERIEL = "MATERIEL";
    public static final String MAIN_DOEUVRE = "MAIN_DOEUVRE";
    public static final String SERVICE = "SERVICE";
    public static final String SOUS_TRAITANCE = "SOUS_TRAITANCE";

    /** Legacy seed value — normalize to {@link #MATIERE}. */
    public static final String LEGACY_MATERIAU = "MATERIAU";

    private ArticleType() {}

    public static boolean isKnown(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }
        String v = value.trim().toUpperCase();
        return MATIERE.equals(v)
                || CONSOMMABLE.equals(v)
                || MATERIEL.equals(v)
                || MAIN_DOEUVRE.equals(v)
                || SERVICE.equals(v)
                || SOUS_TRAITANCE.equals(v)
                || LEGACY_MATERIAU.equals(v);
    }

    public static String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String v = value.trim().toUpperCase();
        if (LEGACY_MATERIAU.equals(v)) {
            return MATIERE;
        }
        return isKnown(v) ? v : v;
    }
}
