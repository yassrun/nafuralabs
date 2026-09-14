package ma.nafura.sektor.ai;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

final class ScreenCatalogScoring {

    private static final Pattern FAIRE_ETUDE = Pattern.compile("\\bfaire\\b.{0,32}\\betude");

    private ScreenCatalogScoring() {}

    static String fold(String value) {
        if (value == null) {
            return "";
        }
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT);
    }

    static int score(ScreenCatalogEntry entry, String foldedQuery) {
        if (foldedQuery == null || foldedQuery.isBlank()) {
            return 0;
        }
        int score = 0;
        if (entry.getId() != null && foldedQuery.contains(fold(entry.getId()))) {
            score += entry.getId().length();
        }
        if (entry.getLabel() != null && foldedQuery.contains(fold(entry.getLabel()))) {
            score += entry.getLabel().length();
        }
        if (entry.getKeywords() != null) {
            for (String keyword : entry.getKeywords()) {
                String folded = fold(keyword);
                if (!folded.isEmpty() && foldedQuery.contains(folded)) {
                    score += folded.length();
                }
            }
        }
        if ("etudes.dossiers".equals(entry.getId()) && FAIRE_ETUDE.matcher(foldedQuery).find()) {
            score += 24;
        }
        return score;
    }
}
