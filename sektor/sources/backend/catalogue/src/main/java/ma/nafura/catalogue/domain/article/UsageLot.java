package ma.nafura.catalogue.domain.article;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;

/**
 * Lot d'ouvrage où un article peut être employé — enum figé, multi-valeurs par article.
 * Axe disjoint de la famille d'approvisionnement ({@code item_categories}).
 *
 * @see ma.nafura.catalogue.domain.article.ItemUsageLot
 */
public enum UsageLot {
    GROS_OEUVRE("Gros œuvre"),
    VRD("VRD"),
    FINITIONS("Finitions"),
    SECOND_OEUVRE("Second œuvre"),
    TECHNIQUE("Lots techniques");

    private final String libelle;

    UsageLot(String libelle) {
        this.libelle = libelle;
    }

    public String getLibelle() {
        return libelle;
    }

    public static List<UsageLot> all() {
        return Arrays.asList(values());
    }

    public static UsageLot parse(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("usageLot code required");
        }
        try {
            return UsageLot.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unknown usageLot: " + value);
        }
    }
}
