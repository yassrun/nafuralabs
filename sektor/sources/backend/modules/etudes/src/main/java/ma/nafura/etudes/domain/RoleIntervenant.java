package ma.nafura.etudes.domain;

/**
 * Rôle d'un intervenant sur un dossier d'étude (chantier V / L4).
 */
public enum RoleIntervenant {
    CHARGE_ETUDE,
    REVISEUR,
    AVIS,
    APPROBATEUR;

    /** Bloque l'approbation du dossier (quatre yeux). */
    public boolean bloqueApprobation() {
        return this == CHARGE_ETUDE || this == REVISEUR;
    }

    public static RoleIntervenant from(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return RoleIntervenant.valueOf(raw.trim().toUpperCase());
    }
}
