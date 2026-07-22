package ma.nafura.etudes.service.bordereau;

import java.math.BigDecimal;

/**
 * Ligne candidate extraite géométriquement d'un bordereau PDF.
 *
 * <p>La codification et l'indentation sont des indices secondaires : une ligne peut
 * être un article exploitable même sans code régulier.
 */
public record BordereauRowCandidate(
        String rowId,
        int page,
        int order,
        String code,
        String libelle,
        String unite,
        BigDecimal quantite,
        Kind kind,
        double confidence,
        String rawText
) {
    public enum Kind {
        ARTICLE,
        LOT,
        SOUS_LOT,
        SECTION,
        AMBIGUOUS,
        NOISE
    }

    public boolean hasPricing() {
        return unite != null && !unite.isBlank() && quantite != null;
    }

    public boolean looksLikeArticle() {
        return kind == Kind.ARTICLE || (kind == Kind.AMBIGUOUS && hasPricing());
    }
}
