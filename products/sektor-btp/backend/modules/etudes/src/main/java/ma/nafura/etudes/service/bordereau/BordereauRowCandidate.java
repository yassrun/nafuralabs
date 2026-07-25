package ma.nafura.etudes.service.bordereau;

import java.math.BigDecimal;
import java.util.Objects;

/**
 * Ligne candidate extraite d'un bordereau (PDF géométrie, tableur, LLM ou vision).
 *
 * <p>La codification et l'indentation sont des indices secondaires : une ligne peut
 * être un article exploitable même sans code régulier. Les valeurs déterministes
 * ({@link ExtractionMethod#PDFBOX}, {@link ExtractionMethod#TABLE}) ne doivent pas
 * être écrasées silencieusement par un LLM.
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
        String rawText,
        ExtractionMethod method,
        String sourceRef
) {
    public enum Kind {
        ARTICLE,
        LOT,
        SOUS_LOT,
        SECTION,
        AMBIGUOUS,
        NOISE
    }

    public enum ExtractionMethod {
        PDFBOX,
        LLM_TEXT,
        VISION,
        TABLE,
        LOCAL
    }

    /** Compat : provenance PDFBox par défaut. */
    public BordereauRowCandidate(
            String rowId,
            int page,
            int order,
            String code,
            String libelle,
            String unite,
            BigDecimal quantite,
            Kind kind,
            double confidence,
            String rawText) {
        this(
                rowId,
                page,
                order,
                code,
                libelle,
                unite,
                quantite,
                kind,
                confidence,
                rawText,
                ExtractionMethod.PDFBOX,
                rawText);
    }

    public boolean hasPricing() {
        return unite != null && !unite.isBlank() && quantite != null;
    }

    public boolean looksLikeArticle() {
        return kind == Kind.ARTICLE || (kind == Kind.AMBIGUOUS && hasPricing());
    }

    public boolean isDeterministic() {
        return method == ExtractionMethod.PDFBOX
                || method == ExtractionMethod.TABLE
                || method == ExtractionMethod.LOCAL;
    }

    public BordereauRowCandidate withMethod(ExtractionMethod newMethod) {
        return new BordereauRowCandidate(
                rowId, page, order, code, libelle, unite, quantite, kind, confidence, rawText,
                newMethod, sourceRef);
    }

    public BordereauRowCandidate withId(String newId) {
        return new BordereauRowCandidate(
                newId, page, order, code, libelle, unite, quantite, kind, confidence, rawText,
                method, sourceRef);
    }

    /**
     * Fusionne deux vues du même article en préservant les valeurs déterministes.
     * Le LLM ne peut compléter que les champs manquants.
     */
    public BordereauRowCandidate mergePreferringLocal(BordereauRowCandidate other) {
        if (other == null) {
            return this;
        }
        boolean preferThis = isDeterministic() || (!other.isDeterministic() && confidence >= other.confidence);
        BordereauRowCandidate primary = preferThis ? this : other;
        BordereauRowCandidate secondary = preferThis ? other : this;

        String mergedUnite = primary.unite;
        BigDecimal mergedQty = primary.quantite;
        if ((mergedUnite == null || mergedUnite.isBlank()) && secondary.unite != null) {
            mergedUnite = secondary.unite;
        }
        if (mergedQty == null && secondary.quantite != null) {
            mergedQty = secondary.quantite;
        }
        String mergedLibelle = (primary.libelle != null && !primary.libelle.isBlank())
                ? primary.libelle
                : secondary.libelle;
        String mergedCode = (primary.code != null && !primary.code.isBlank())
                ? primary.code
                : secondary.code;
        Kind mergedKind = primary.looksLikeArticle() || secondary.looksLikeArticle()
                ? Kind.ARTICLE
                : primary.kind;
        double mergedConfidence = Math.max(primary.confidence, secondary.confidence);
        if (mergedUnite != null && mergedQty != null) {
            mergedConfidence = Math.max(mergedConfidence, 0.85);
            mergedKind = Kind.ARTICLE;
        }
        return new BordereauRowCandidate(
                primary.rowId,
                primary.page > 0 ? primary.page : secondary.page,
                Math.min(primary.order, secondary.order),
                mergedCode,
                mergedLibelle,
                mergedUnite,
                mergedQty,
                mergedKind,
                mergedConfidence,
                primary.rawText != null ? primary.rawText : secondary.rawText,
                primary.method,
                primary.sourceRef != null ? primary.sourceRef : secondary.sourceRef);
    }

    public String dedupeKey() {
        String c = code == null ? "" : code.trim().toUpperCase().replaceAll("\\s+", "");
        String l = libelle == null ? "" : libelle.trim().toUpperCase().replaceAll("\\s+", " ");
        String u = unite == null ? "" : unite.trim().toUpperCase();
        String q = quantite == null ? "" : quantite.stripTrailingZeros().toPlainString();
        return c + "|" + l + "|" + u + "|" + q;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof BordereauRowCandidate that)) {
            return false;
        }
        return Objects.equals(rowId, that.rowId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(rowId);
    }
}
