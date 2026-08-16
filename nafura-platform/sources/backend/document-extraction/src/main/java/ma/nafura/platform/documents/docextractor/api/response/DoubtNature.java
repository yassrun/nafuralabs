package ma.nafura.platform.documents.docextractor.api.response;

/**
 * Deux natures, jamais fusionnées à l'écran.
 * EXTRACTION = on n'est pas sûr d'avoir bien lu.
 * SOURCE_GAP = le fichier ne contient pas la valeur.
 */
public enum DoubtNature {
    EXTRACTION,
    SOURCE_GAP;

    public static DoubtNature fromKind(FieldIssueKind kind) {
        if (kind == FieldIssueKind.MISSING_REQUIRED) {
            return SOURCE_GAP;
        }
        return EXTRACTION;
    }
}
