package ma.nafura.catalogue.service;

import java.util.HashSet;
import java.util.Set;

/** Similarité trigramme (Dice) — déterministe, sans LLM. */
public final class TrigramSimilarity {

    private TrigramSimilarity() {}

    public static double score(String a, String b) {
        if (a == null || b == null || a.isBlank() || b.isBlank()) {
            return 0.0;
        }
        if (a.equals(b)) {
            return 1.0;
        }
        Set<String> ta = trigrams(a);
        Set<String> tb = trigrams(b);
        if (ta.isEmpty() || tb.isEmpty()) {
            return 0.0;
        }
        int inter = 0;
        for (String t : ta) {
            if (tb.contains(t)) {
                inter++;
            }
        }
        return (2.0 * inter) / (ta.size() + tb.size());
    }

    static Set<String> trigrams(String s) {
        String padded = "  " + s + " ";
        Set<String> out = new HashSet<>();
        for (int i = 0; i < padded.length() - 2; i++) {
            out.add(padded.substring(i, i + 3));
        }
        return out;
    }
}
