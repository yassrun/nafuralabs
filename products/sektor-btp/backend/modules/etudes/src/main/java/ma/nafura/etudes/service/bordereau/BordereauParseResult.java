package ma.nafura.etudes.service.bordereau;

import java.util.List;
import java.util.Set;

/**
 * Résultat du parseur géométrique local, avant classification LLM.
 */
public record BordereauParseResult(
        int pageCount,
        int textDensityPerPage,
        List<BordereauRowCandidate> rows,
        Set<Integer> pagesWithCandidates,
        Quality quality,
        String rejectReason
) {
    public enum Quality {
        /** Couverture et densité suffisantes pour le chemin hybride. */
        USABLE,
        /** Texte trop pauvre / scan — fallback LLM complet (binary). */
        INSUFFICIENT,
        /** PDF illisible. */
        FAILED
    }

    public List<BordereauRowCandidate> articleCandidates() {
        return rows.stream().filter(BordereauRowCandidate::looksLikeArticle).toList();
    }

    public List<BordereauRowCandidate> groupingCandidates() {
        return rows.stream()
                .filter(r -> r.kind() == BordereauRowCandidate.Kind.LOT
                        || r.kind() == BordereauRowCandidate.Kind.SOUS_LOT
                        || r.kind() == BordereauRowCandidate.Kind.SECTION)
                .toList();
    }

    public boolean usableForHybrid() {
        return quality == Quality.USABLE && !articleCandidates().isEmpty();
    }

    public BordereauParseResult withRows(List<BordereauRowCandidate> newRows) {
        Set<Integer> pages = new java.util.LinkedHashSet<>();
        for (BordereauRowCandidate row : newRows) {
            if (row.looksLikeArticle()) {
                pages.add(row.page());
            }
        }
        Quality q = quality;
        if (!newRows.isEmpty() && q != Quality.FAILED && !pages.isEmpty()) {
            q = Quality.USABLE;
        }
        return new BordereauParseResult(
                pageCount, textDensityPerPage, List.copyOf(newRows), Set.copyOf(pages), q, rejectReason);
    }

    public static BordereauParseResult failed(String reason) {
        return new BordereauParseResult(0, 0, List.of(), Set.of(), Quality.FAILED, reason);
    }

    public static BordereauParseResult insufficient(
            int pages, int density, List<BordereauRowCandidate> rows, String reason) {
        return new BordereauParseResult(
                pages, density, rows, Set.of(), Quality.INSUFFICIENT, reason);
    }
}
