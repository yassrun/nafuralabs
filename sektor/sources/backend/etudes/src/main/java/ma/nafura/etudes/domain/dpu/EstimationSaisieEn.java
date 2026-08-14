package ma.nafura.etudes.domain.dpu;

/** Intention de saisie quand origine = ESTIME. */
public enum EstimationSaisieEn {
    COUT,
    VENTE;

    public static EstimationSaisieEn from(String raw) {
        if (raw == null || raw.isBlank()) {
            return COUT;
        }
        return EstimationSaisieEn.valueOf(raw.trim().toUpperCase());
    }
}
