package ma.nafura.item.domain;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;

/**
 * Nature d'article élémentaire — enum verrouillé, non éditable par le tenant.
 * Pilote stockabilité, valorisation, UoM / poste budget par défaut, et type DPU.
 *
 * @see NatureComposantMapping
 */
public enum Nature {

    MATIERE("Matière", true, true, null, "MATERIAUX", "MATIERE"),
    CONSOMMABLE("Consommable", true, true, "U", "MATERIAUX", "MATIERE"),
    CARBURANT("Carburant", true, true, "L", "CARBURANT", "MATIERE"),
    OUTILLAGE("Outillage", true, true, "U", "MATERIEL", "MATERIEL"),
    MATERIEL("Matériel en propre", false, false, "H", "MATERIEL", "MATERIEL"),
    LOCATION("Location matériel", false, false, "H", "LOCATION_MATERIEL", "MATERIEL"),
    MAIN_DOEUVRE("Main d'œuvre", false, false, "H", "MO", "MAIN_DOEUVRE"),
    SOUS_TRAITANCE("Sous-traitance", false, false, "LOT", "SOUS_TRAITANCE", "SOUS_TRAITANCE"),
    SERVICE("Service externe", false, false, "U", "FRAIS_GENERAUX", "SOUS_TRAITANCE");

    /** Legacy seed / front value — normalize to {@link #MATIERE}. */
    public static final String LEGACY_MATERIAU = "MATERIAU";

    private final String libelle;
    private final boolean stockable;
    private final boolean valorise;
    private final String uomDefaut;
    private final String posteBudgetDefaut;
    private final String typeDpu;

    Nature(
            String libelle,
            boolean stockable,
            boolean valorise,
            String uomDefaut,
            String posteBudgetDefaut,
            String typeDpu) {
        this.libelle = libelle;
        this.stockable = stockable;
        this.valorise = valorise;
        this.uomDefaut = uomDefaut;
        this.posteBudgetDefaut = posteBudgetDefaut;
        this.typeDpu = typeDpu;
    }

    public String getLibelle() {
        return libelle;
    }

    public boolean isStockable() {
        return stockable;
    }

    public boolean isValorise() {
        return valorise;
    }

    public String getUomDefaut() {
        return uomDefaut;
    }

    public String getPosteBudgetDefaut() {
        return posteBudgetDefaut;
    }

    public String getTypeDpu() {
        return typeDpu;
    }

    public static List<Nature> all() {
        return Arrays.asList(values());
    }

    /**
     * Parse a stored / API value. Accepts legacy {@code MATERIAU}.
     * Blank → {@code null}. Unknown → {@link IllegalArgumentException} (HTTP 400).
     */
    public static Nature fromLegacy(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String v = value.trim().toUpperCase(Locale.ROOT);
        if (LEGACY_MATERIAU.equals(v)) {
            return MATIERE;
        }
        try {
            return Nature.valueOf(v);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unknown nature: " + value);
        }
    }

    /** Like {@link #fromLegacy} but blank → {@code defaultNature}. */
    public static Nature fromLegacyOrDefault(String value, Nature defaultNature) {
        Nature parsed = fromLegacy(value);
        return parsed != null ? parsed : defaultNature;
    }
}
