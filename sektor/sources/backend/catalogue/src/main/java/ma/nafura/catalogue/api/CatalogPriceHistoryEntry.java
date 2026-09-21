package ma.nafura.catalogue.api;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Ligne d'historique de prix d'achat — consultations, commandes, factures, catalogue.
 */
public record CatalogPriceHistoryEntry(
        String kind,
        String detail,
        String priceSource,
        BigDecimal unitPrice,
        LocalDate sourceDate,
        UUID sourceRefId,
        String sourceLabel,
        String supplierName,
        boolean expired) {

    public static final String KIND_ACHATS = "ACHATS";
    public static final String KIND_CONSULTATION = "CONSULTATION";
    public static final String KIND_CATALOGUE = "CATALOGUE";
    public static final String KIND_TARIF = "TARIF";

    public static final String DETAIL_FACTURE = "FACTURE";
    public static final String DETAIL_COMMANDE = "COMMANDE";
    public static final String DETAIL_DEVIS = "DEVIS";
    public static final String DETAIL_CATALOGUE = "CATALOGUE";
    public static final String DETAIL_CONTRAT = "CONTRAT";
    public static final String DETAIL_TARIF = "TARIF";
}
