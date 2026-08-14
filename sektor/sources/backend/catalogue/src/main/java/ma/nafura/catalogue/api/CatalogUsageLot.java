package ma.nafura.catalogue.api;

import ma.nafura.catalogue.domain.article.UsageLot;

/** Lots d'usage publiés — Études stocke le code, ne voit pas l'enum Item. */
public final class CatalogUsageLot {

    public static final String GROS_OEUVRE = "GROS_OEUVRE";
    public static final String VRD = "VRD";
    public static final String FINITIONS = "FINITIONS";
    public static final String SECOND_OEUVRE = "SECOND_OEUVRE";
    public static final String TECHNIQUE = "TECHNIQUE";

    private CatalogUsageLot() {}

    public static String parse(String value) {
        return UsageLot.parse(value).name();
    }
}
