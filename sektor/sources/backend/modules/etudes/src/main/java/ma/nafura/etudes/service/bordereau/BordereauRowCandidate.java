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
     * Fusionne deux vues du même article en préservant les valeurs déterministes
     * (unité / qté), mais en préférant un libellé vision/LLM complet si le local
     * est tronqué (typique PDF multi-colonnes : « TRANCHEERS… » au lieu de
     * « FOUILLES EN PUITS ET EN TRANCHEES… »).
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
        String mergedLibelle = pickBestLibelle(primary, secondary);
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
        // Prefer vision/LLM method when its libellé won over a truncated local one.
        ExtractionMethod mergedMethod = primary.method;
        if (mergedLibelle != null
                && secondary.libelle != null
                && mergedLibelle.equals(secondary.libelle)
                && !mergedLibelle.equals(primary.libelle)
                && !secondary.isDeterministic()) {
            mergedMethod = secondary.method;
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
                mergedMethod,
                primary.sourceRef != null ? primary.sourceRef : secondary.sourceRef);
    }

    /** Libellé tronqué / fragment de début de cellule (géométrie PDFBox). */
    public static boolean looksTruncated(String libelle) {
        if (libelle == null || libelle.isBlank()) {
            return true;
        }
        String trimmed = libelle.trim();
        String first = trimmed.split("\\s+")[0].toUpperCase(java.util.Locale.ROOT);
        if (FRAGMENT_STARTERS.contains(first)) {
            return true;
        }
        // Very short labels are suspicious only if they look cut mid-word / mid-phrase.
        return trimmed.length() < 10;
    }

    private static final java.util.Set<String> FRAGMENT_STARTERS = java.util.Set.of(
            "DE", "DES", "DU", "LA", "LE", "LES", "ET", "OU", "EN", "DANS", "POUR",
            "Y", "AUX", "AU", "SUR", "AVEC", "SANS", "COMPRIS", "Y/C", "MM", "CM",
            "TRANCHEERS", "TRANCHEES", "PUBLIQUES", "GALVANISÉE", "GALVANISEE", "PRINCIPAL",
            "SUPPLEMENTAIRE", "MÉTALIQUE", "METALLIQUE", "OUVRAGES", "INFRASTRUCTURE",
            "CARON", "REMBLAI");

    private static String pickBestLibelle(BordereauRowCandidate a, BordereauRowCandidate b) {
        String la = a.libelle;
        String lb = b.libelle;
        if (la == null || la.isBlank()) {
            return lb;
        }
        if (lb == null || lb.isBlank()) {
            return la;
        }
        boolean aTrunc = looksTruncated(la);
        boolean bTrunc = looksTruncated(lb);
        if (aTrunc && !bTrunc) {
            return lb;
        }
        if (bTrunc && !aTrunc) {
            return la;
        }
        // Same truncation status: prefer longer (vision often recovers the full cell).
        if (lb.length() > la.length() + 8) {
            return lb;
        }
        if (la.length() > lb.length() + 8) {
            return la;
        }
        // Prefer non-deterministic (vision) wording when lengths are close and local looks weak.
        if (aTrunc && b.method == ExtractionMethod.VISION) {
            return lb;
        }
        if (bTrunc && a.method == ExtractionMethod.VISION) {
            return la;
        }
        return la;
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
