package ma.nafura.catalogue.api;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Surface publiée Catalogue. Aucune entité / repository Item dans la signature.
 */
public interface CatalogLookupApi {

    List<CatalogCandidate> lookup(String designation, String nature, int limit);

    Optional<CatalogItemSnapshot> getItem(UUID itemId);

    CatalogPriceSnapshot resolvePurchasePrice(UUID itemId, CatalogPriceContext context);

    CatalogItemSnapshot createAllege(String libelle, String nature, String uomCode);

    List<String> listActiveUnitCodes();
}
