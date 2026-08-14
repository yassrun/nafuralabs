package ma.nafura.etudes.adapters;

import java.text.Normalizer;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.util.StringUtils;

/**
 * Mappe une unité libre (OCR / LLM) vers un code du référentiel {@code unit_of_measure}.
 */
final class UniteNormalizer {

    private static final Map<String, String> ALIASES = Map.ofEntries(
            Map.entry("M3", "M3"),
            Map.entry("M³", "M3"),
            Map.entry("M^3", "M3"),
            Map.entry("M2", "M2"),
            Map.entry("M²", "M2"),
            Map.entry("M^2", "M2"),
            Map.entry("ML", "ML"),
            Map.entry("M.L", "ML"),
            Map.entry("MLIN", "ML"),
            Map.entry("METRELINEAIRE", "ML"),
            Map.entry("KG", "KG"),
            Map.entry("KGS", "KG"),
            Map.entry("T", "T"),
            Map.entry("TO", "T"),
            Map.entry("TONNE", "T"),
            Map.entry("TONNES", "T"),
            Map.entry("U", "U"),
            Map.entry("UN", "U"),
            Map.entry("UNITE", "U"),
            Map.entry("UNITÉ", "U"),
            Map.entry("UNITES", "U"),
            Map.entry("EA", "EA"),
            Map.entry("FF", "FF"),
            Map.entry("F", "FF"),
            Map.entry("FORFAIT", "FF"),
            Map.entry("H", "H"),
            Map.entry("HR", "H"),
            Map.entry("HEURE", "H"),
            Map.entry("HEURES", "H"),
            Map.entry("J", "J"),
            Map.entry("JOUR", "J"),
            Map.entry("JOURS", "J"),
            Map.entry("ENS", "ENS"),
            Map.entry("E", "ENS"),
            Map.entry("ENSEMBLE", "ENS"),
            Map.entry("L", "L"),
            Map.entry("LITRE", "L"),
            Map.entry("LITRES", "L"),
            Map.entry("PM", "PM"),
            Map.entry("POURMEMOIRE", "PM"));

    private UniteNormalizer() {}

    static String normalize(String raw, Collection<String> allowedCodes) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        Set<String> allowed = new LinkedHashSet<>();
        Map<String, String> byFold = new HashMap<>();
        if (allowedCodes != null) {
            for (String code : allowedCodes) {
                if (!StringUtils.hasText(code)) {
                    continue;
                }
                String trimmed = code.trim();
                allowed.add(trimmed);
                byFold.put(fold(trimmed), trimmed);
            }
        }

        String folded = fold(raw);
        if (folded.isEmpty()) {
            return raw.trim();
        }
        String aliased = ALIASES.getOrDefault(folded, folded);

        if (byFold.containsKey(aliased)) {
            return byFold.get(aliased);
        }
        if (byFold.containsKey(folded)) {
            return byFold.get(folded);
        }
        // exact code already in referential (case-insensitive)
        for (String code : allowed) {
            if (fold(code).equals(aliased) || fold(code).equals(folded)) {
                return code;
            }
        }
        // keep original trimmed if unknown — UI dropdown can still re-map
        return raw.trim();
    }

    /**
     * Forme comparable : NFKC (㎡→m2), majuscules, sans accents, sans ponctuation.
     */
    static String fold(String value) {
        String n = Normalizer.normalize(value.trim(), Normalizer.Form.NFKC);
        n = Normalizer.normalize(n, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toUpperCase(Locale.ROOT)
                .replace('³', '3')
                .replace('²', '2')
                .replaceAll("[^A-Z0-9]", "");
        return n;
    }
}
