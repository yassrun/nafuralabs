package ma.nafura.etudes.domain;

/**
 * Origine du coût d'un article du bordereau (décision A — FOURNI disparaît).
 */
public enum OrigineCout {
    DECOMPOSE,
    FORFAIT,
    ESTIME;

    public static OrigineCout from(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return OrigineCout.valueOf(raw.trim().toUpperCase());
    }

    /** Migration / API legacy : FOURNI → ESTIME. */
    public static OrigineCout fromLegacyMode(String mode) {
        if (mode == null || mode.isBlank()) {
            return ESTIME;
        }
        String m = mode.trim().toUpperCase();
        if ("DECOMPOSE".equals(m)) {
            return DECOMPOSE;
        }
        if ("FORFAIT".equals(m)) {
            return FORFAIT;
        }
        // FOURNI et tout le reste → ESTIME
        return ESTIME;
    }
}
