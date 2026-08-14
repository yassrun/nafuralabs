package ma.nafura.catalogue.service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/**
 * Règles synonymes / équivalences métier (déterministes).
 * Ex. « peinture blanche mur intérieur » ≈ « peinture acrylique intérieure ».
 */
public final class RegleSynonymes {

    private static final Map<String, Set<String>> GROUPS = new LinkedHashMap<>();

    static {
        GROUPS.put(
                "peinture-interieur",
                Set.of(
                        "peinture",
                        "acrylique",
                        "interieure",
                        "interieur",
                        "mur",
                        "blanc",
                        "blanche",
                        "mate",
                        "mat"));
    }

    private RegleSynonymes() {}

    /**
     * Score 0..1 si les tokens de la requête et du catalogue partagent un groupe
     * et un recouvrement suffisant.
     */
    public static double score(String queryNorm, String catalogNorm) {
        Set<String> q = Set.of(LibelleNormalizer.tokens(queryNorm));
        Set<String> c = Set.of(LibelleNormalizer.tokens(catalogNorm));
        if (q.isEmpty() || c.isEmpty()) {
            return 0.0;
        }
        double best = 0.0;
        for (Set<String> group : GROUPS.values()) {
            long qHit = q.stream().filter(group::contains).count();
            long cHit = c.stream().filter(group::contains).count();
            if (qHit >= 2 && cHit >= 2) {
                // recouvrement relatif aux tokens hors stop faibles
                long shared = q.stream().filter(c::contains).count();
                double overlap = (double) shared / Math.max(q.size(), c.size());
                double groupBoost = 0.55 + 0.35 * Math.min(1.0, (qHit + cHit) / 8.0);
                best = Math.max(best, Math.max(overlap, groupBoost));
            }
        }
        return Math.min(1.0, best);
    }
}
