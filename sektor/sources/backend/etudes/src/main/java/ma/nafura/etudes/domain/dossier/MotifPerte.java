package ma.nafura.etudes.domain.dossier;

import java.util.Locale;

/** Motif de perte commerciale (L13) — signal d'apprentissage. */
public enum MotifPerte {
    PRIX,
    DELAI,
    TECHNIQUE,
    ADMINISTRATIF,
    SANS_SUITE;

    public static MotifPerte parse(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("etudes.dossier.motif_perte.required");
        }
        try {
            return MotifPerte.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("etudes.dossier.motif_perte.invalide");
        }
    }
}
