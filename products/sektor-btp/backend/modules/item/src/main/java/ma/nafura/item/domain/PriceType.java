package ma.nafura.item.domain;

/**
 * Types de tarif daté ({@code ItemPrice.priceType}).
 */
public final class PriceType {

    /** Tarif d'achat de référence. */
    public static final String ACHAT_STANDARD = "ACHAT_STANDARD";

    /** Tarif de vente (négoce) — activable via paramètre tenant. */
    public static final String VENTE = "VENTE";

    /** Transfert inter-sociétés. */
    public static final String TRANSFERT = "TRANSFERT";

    private PriceType() {}

    public static boolean isKnown(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }
        String v = value.trim().toUpperCase();
        return ACHAT_STANDARD.equals(v) || VENTE.equals(v) || TRANSFERT.equals(v);
    }
}
