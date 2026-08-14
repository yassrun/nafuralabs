package ma.nafura.etudes.domain;

/** Statut de traitement d'un avis d'exécution (L8). */
public enum StatutAvisExecution {
    OUVERT,
    PRIS_EN_COMPTE,
    ECARTE;

    public static StatutAvisExecution from(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return StatutAvisExecution.valueOf(raw.trim().toUpperCase());
    }
}
