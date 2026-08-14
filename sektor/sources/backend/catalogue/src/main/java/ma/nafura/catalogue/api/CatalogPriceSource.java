package ma.nafura.catalogue.api;

/** Provenance d'un prix résolu — valeurs gelées sur le DPU. */
public final class CatalogPriceSource {

    public static final String CONSULTE = "CONSULTE";
    public static final String CONTRAT = "CONTRAT";
    public static final String CATALOGUE = "CATALOGUE";
    public static final String TARIF = "TARIF";
    public static final String HISTORIQUE = "HISTORIQUE";
    public static final String PMP = "PMP";
    public static final String BIBLIOTHEQUE = "BIBLIOTHEQUE";
    public static final String MANUEL = "MANUEL";

    private CatalogPriceSource() {}
}
