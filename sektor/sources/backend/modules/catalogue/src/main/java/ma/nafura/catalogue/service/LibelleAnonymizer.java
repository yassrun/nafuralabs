package ma.nafura.catalogue.service;

import java.util.Arrays;
import java.util.Locale;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Anonymise les libellés d'exemple attachés aux candidats (AC L16).
 * Aucun nom de tenant, aucun identifiant client, aucun e-mail / téléphone.
 */
public final class LibelleAnonymizer {

    private static final Pattern EMAIL = Pattern.compile("[\\w.+-]+@[\\w.-]+\\.[a-zA-Z]{2,}");
    private static final Pattern PHONE = Pattern.compile("\\+?\\d[\\d\\s.-]{7,}\\d");
    private static final Pattern UUID =
            Pattern.compile("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}");
    private static final Pattern LONG_DIGITS = Pattern.compile("\\b\\d{5,}\\b");

    private LibelleAnonymizer() {}

    public static String anonymiser(String raw) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        String s = EMAIL.matcher(raw).replaceAll("");
        s = PHONE.matcher(s).replaceAll("");
        s = UUID.matcher(s).replaceAll("");
        s = LONG_DIGITS.matcher(s).replaceAll("");
        // drop tokens that look like proper nouns / company markers
        String norm = LibelleNormalizer.normalize(s);
        return Arrays.stream(LibelleNormalizer.tokens(norm))
                .filter(t -> t.length() >= 2)
                .filter(t -> !t.equals("sarl") && !t.equals("sa") && !t.equals("sas"))
                .limit(8)
                .collect(Collectors.joining(" "));
    }

    /** Clé de regroupement stable (slug-ish) pour upsert candidat. */
    public static String cleRegroupement(String libellePropose) {
        String a = anonymiser(libellePropose);
        if (a.isBlank()) {
            return "inconnu";
        }
        return a.replace(' ', '-').toLowerCase(Locale.ROOT);
    }
}
