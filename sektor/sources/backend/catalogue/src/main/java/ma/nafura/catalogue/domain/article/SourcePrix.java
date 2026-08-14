package ma.nafura.catalogue.domain.article;

/**
 * Provenance d'un prix résolu — hiérarchie de {@code ResolutionPrixService}.
 */
public final class SourcePrix {

    public static final String CONSULTE = "CONSULTE";
    public static final String CONTRAT = "CONTRAT";
    public static final String CATALOGUE = "CATALOGUE";
    public static final String TARIF = "TARIF";
    public static final String HISTORIQUE = "HISTORIQUE";
    public static final String PMP = "PMP";
    public static final String BIBLIOTHEQUE = "BIBLIOTHEQUE";
    public static final String MANUEL = "MANUEL";

    private SourcePrix() {}
}
