package ma.nafura.catalogue.domain;

/**
 * Paramètre tenant : base de chiffrage pour la résolution de prix d'achat.
 */
public final class BasePrixChiffrage {

    /** Hiérarchie marché (défaut) — PMP en avant-dernier recours. */
    public static final String MARCHE = "MARCHE";

    /** PMP prioritaire après une éventuelle offre d'affaire. */
    public static final String PMP = "PMP";

    /** Retient le maximum entre prix marché et PMP. */
    public static final String MAX = "MAX";

    private BasePrixChiffrage() {}

    public static String normalize(String value) {
        if (value == null || value.isBlank()) {
            return MARCHE;
        }
        String v = value.trim().toUpperCase();
        if (PMP.equals(v) || MAX.equals(v) || MARCHE.equals(v)) {
            return v;
        }
        return MARCHE;
    }
}
