package ma.nafura.achats.domain.contrat;

/**
 * Origine d'une ligne de catalogue fournisseur.
 */
public final class CatalogueSource {

    public static final String SAISIE_MANUELLE = "SAISIE_MANUELLE";
    public static final String OFFRE_RETENUE = "OFFRE_RETENUE";
    public static final String FACTURE = "FACTURE";
    public static final String CONTRAT = "CONTRAT";
    public static final String IMPORT_CATALOGUE = "IMPORT_CATALOGUE";

    private CatalogueSource() {}
}
