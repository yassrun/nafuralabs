package ma.nafura.etudes.domain;

import java.util.Locale;

/**
 * Provenance d'un ouvrage en bibliothèque (L10). Capitalisation = L12.
 */
public enum OuvrageOrigine {
    SAISIE,
    ETUDE,
    CATALOGUE;

    public static OuvrageOrigine parse(String value) {
        if (value == null || value.isBlank()) {
            return SAISIE;
        }
        return OuvrageOrigine.valueOf(value.trim().toUpperCase(Locale.ROOT));
    }
}
