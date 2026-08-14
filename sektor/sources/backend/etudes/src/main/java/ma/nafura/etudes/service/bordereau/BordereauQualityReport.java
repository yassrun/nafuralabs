package ma.nafura.etudes.service.bordereau;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Score de qualité d'une extraction bordereau (locale et/ou LLM).
 */
public record BordereauQualityReport(
        int pageCount,
        int pagesWithArticles,
        int candidateCount,
        int articleCount,
        int pricedCount,
        double pricedRatio,
        int missingFieldCount,
        int duplicateCount,
        int orphanCount,
        double minConfidence,
        double score,
        Set<Integer> weakPages,
        List<String> warnings
) {
    public static final double ACCEPT_SCORE = 0.55;
    public static final double HIGH_SCORE = 0.82;

    public boolean acceptable() {
        return articleCount > 0 && score >= ACCEPT_SCORE;
    }

    public boolean highConfidence() {
        return articleCount > 0 && score >= HIGH_SCORE && weakPages.isEmpty();
    }

    public boolean hasZeroArticles() {
        return articleCount <= 0;
    }

    public static BordereauQualityReport evaluate(BordereauParseResult parse, int orphanArticles) {
        if (parse == null) {
            return empty("null_parse");
        }
        List<BordereauRowCandidate> articles = parse.articleCandidates();
        int articleCount = articles.size();
        long priced = articles.stream().filter(BordereauRowCandidate::hasPricing).count();
        double pricedRatio = articleCount == 0 ? 0.0 : priced / (double) articleCount;
        int missing = 0;
        double minConf = 1.0;
        Set<String> seen = new LinkedHashSet<>();
        int duplicates = 0;
        for (BordereauRowCandidate a : articles) {
            if (a.unite() == null || a.unite().isBlank()) {
                missing++;
            }
            if (a.quantite() == null) {
                missing++;
            }
            if (a.libelle() == null || a.libelle().isBlank()) {
                missing++;
            }
            minConf = Math.min(minConf, a.confidence());
            String key = a.dedupeKey();
            if (!seen.add(key)) {
                duplicates++;
            }
        }
        if (articleCount == 0) {
            minConf = 0.0;
        }

        Set<Integer> weak = detectWeakPages(parse);
        List<String> warnings = new ArrayList<>();
        if (articleCount == 0) {
            warnings.add("zero_articles");
        }
        if (pricedRatio < 0.45) {
            warnings.add("low_priced_ratio");
        }
        if (!weak.isEmpty()) {
            warnings.add("weak_pages:" + weak);
        }
        if (duplicates > 0) {
            warnings.add("duplicates:" + duplicates);
        }
        if (orphanArticles > 0) {
            warnings.add("orphans:" + orphanArticles);
        }

        double coverage = parse.pageCount() == 0
                ? 0.0
                : parse.pagesWithCandidates().size() / (double) parse.pageCount();
        double score = 0.35 * Math.min(1.0, articleCount / 20.0)
                + 0.30 * pricedRatio
                + 0.20 * coverage
                + 0.10 * Math.max(0.0, 1.0 - missing / Math.max(1.0, articleCount * 2.0))
                + 0.05 * Math.max(0.0, minConf);
        if (articleCount == 0) {
            score = 0.0;
        }
        if (!weak.isEmpty()) {
            score = Math.min(score, 0.75);
        }

        return new BordereauQualityReport(
                parse.pageCount(),
                parse.pagesWithCandidates().size(),
                parse.rows().size(),
                articleCount,
                (int) priced,
                pricedRatio,
                missing,
                duplicates,
                orphanArticles,
                minConf,
                score,
                weak,
                List.copyOf(warnings));
    }

    public static Set<Integer> detectWeakPages(BordereauParseResult parse) {
        Set<Integer> weak = new LinkedHashSet<>();
        if (parse == null || parse.rows().isEmpty()) {
            return weak;
        }
        for (int page = 1; page <= parse.pageCount(); page++) {
            final int p = page;
            List<BordereauRowCandidate> pageArticles = parse.rows().stream()
                    .filter(r -> r.page() == p && r.looksLikeArticle())
                    .toList();
            List<BordereauRowCandidate> pageRows = parse.rows().stream()
                    .filter(r -> r.page() == p)
                    .toList();
            if (pageRows.isEmpty()) {
                continue;
            }
            if (pageArticles.isEmpty()) {
                // Page with only groups / noise is OK (récaps). Mark weak only if ambiguous rows.
                boolean ambiguous = pageRows.stream()
                        .anyMatch(r -> r.kind() == BordereauRowCandidate.Kind.AMBIGUOUS);
                if (ambiguous) {
                    weak.add(p);
                }
                continue;
            }
            long priced = pageArticles.stream().filter(BordereauRowCandidate::hasPricing).count();
            double ratio = priced / (double) pageArticles.size();
            double avgConf = pageArticles.stream()
                    .mapToDouble(BordereauRowCandidate::confidence)
                    .average()
                    .orElse(0);
            if (ratio < 0.45 || avgConf < 0.6) {
                weak.add(p);
            }
        }
        return weak;
    }

    public static BordereauQualityReport empty(String reason) {
        return new BordereauQualityReport(
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                Set.of(), List.of(reason));
    }
}
