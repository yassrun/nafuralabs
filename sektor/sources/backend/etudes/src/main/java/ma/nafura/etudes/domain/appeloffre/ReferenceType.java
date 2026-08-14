package ma.nafura.etudes.domain.appeloffre;

/**
 * Type de référence d'un composant (DPU ou ouvrage) — décision D / phase 2 L2.
 *
 * <p>Exclusivité : exactement une forme valide (ITEM | OUVRAGE | LIBRE).
 */
public enum ReferenceType {
    ITEM,
    OUVRAGE,
    LIBRE;

    public static ReferenceType from(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return ReferenceType.valueOf(raw.trim().toUpperCase());
    }

    public static ReferenceType require(String raw) {
        ReferenceType type = from(raw);
        if (type == null) {
            throw new IllegalArgumentException("etudes.composant.reference_type.required");
        }
        return type;
    }
}
