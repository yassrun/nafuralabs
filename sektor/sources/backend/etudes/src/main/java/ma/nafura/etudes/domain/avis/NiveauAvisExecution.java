package ma.nafura.etudes.domain.avis;

/** Niveau d'un avis d'exécution (L8). */
public enum NiveauAvisExecution {
    REALISABLE,
    DIFFICILE,
    IRREALISABLE;

    public static NiveauAvisExecution from(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return NiveauAvisExecution.valueOf(raw.trim().toUpperCase());
    }

    public boolean exigeCommentaire() {
        return this != REALISABLE;
    }
}
