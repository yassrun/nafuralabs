package ma.nafura.catalogue.service;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.Locale;
import java.util.stream.Collectors;

/** Normalisation déterministe des libellés pour EXACT / REGLE / TRIGRAM. */
public final class LibelleNormalizer {

    private LibelleNormalizer() {}

    public static String normalize(String raw) {
        if (raw == null) {
            return "";
        }
        String n = Normalizer.normalize(raw.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
        return n;
    }

    public static String[] tokens(String normalized) {
        if (normalized.isBlank()) {
            return new String[0];
        }
        return normalized.split(" ");
    }

    public static String sortedTokenKey(String normalized) {
        return Arrays.stream(tokens(normalized)).sorted().collect(Collectors.joining(" "));
    }
}
