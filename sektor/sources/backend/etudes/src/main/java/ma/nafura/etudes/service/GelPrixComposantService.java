package ma.nafura.etudes.service;

import java.time.LocalDate;
import java.util.UUID;
import ma.nafura.catalogue.api.CatalogLookupApi;
import ma.nafura.catalogue.api.CatalogPriceContext;
import ma.nafura.catalogue.api.CatalogPriceSnapshot;
import ma.nafura.catalogue.api.CatalogPriceSource;
import ma.nafura.etudes.api.request.ComposantDpuInputDto;
import ma.nafura.etudes.domain.appeloffre.ReferenceType;
import ma.nafura.etudes.domain.dpu.ComposantDpu;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Branche {@link CatalogLookupApi} sur les composants DPU ITEM et gèle le résultat (L5).
 */
@Service
public class GelPrixComposantService {

    private final CatalogLookupApi catalogLookupApi;
    private final ParametresEtudeService parametres;

    public GelPrixComposantService(
            CatalogLookupApi catalogLookupApi, ParametresEtudeService parametres) {
        this.catalogLookupApi = catalogLookupApi;
        this.parametres = parametres;
    }

    public boolean doitResoudre(ComposantDpuInputDto input, boolean force) {
        if (force) {
            return true;
        }
        if (input == null || !isItem(input.getReferenceType())) {
            return false;
        }
        if (Boolean.TRUE.equals(input.getResoudrePrix())) {
            return true;
        }
        // Premier gel : pas encore de métadonnées de source persistées côté client
        return !StringUtils.hasText(input.getPrixLibelleSource()) && input.getPrixSourceRefId() == null;
    }

    public CatalogPriceSnapshot resoudre(UUID itemId) {
        if (itemId == null) {
            return null;
        }
        CatalogPriceContext ctx = new CatalogPriceContext(
                LocalDate.now(),
                null,
                null,
                null,
                parametres.basePrixChiffrage());
        return catalogLookupApi.resolvePurchasePrice(itemId, ctx);
    }

    public void appliquerGel(ComposantDpu.ComposantDpuBuilder builder, CatalogPriceSnapshot resolu) {
        if (resolu == null || resolu.unitPrice() == null) {
            return;
        }
        builder.prixUnitaire(resolu.unitPrice());
        builder.sourcePrix(StringUtils.hasText(resolu.priceSource()) ? resolu.priceSource() : CatalogPriceSource.MANUEL);
        builder.prixSourceRefId(resolu.sourceRefId());
        builder.prixDateSource(resolu.sourceDate());
        builder.prixCurrencyId(resolu.currencyId());
        builder.prixLibelleSource(resolu.sourceLabel());
        if (CatalogPriceSource.CONSULTE.equals(resolu.priceSource()) && resolu.sourceRefId() != null) {
            builder.offreFournisseurId(resolu.sourceRefId());
        }
    }

    public void appliquerGel(ComposantDpu composant, CatalogPriceSnapshot resolu) {
        if (composant == null || resolu == null || resolu.unitPrice() == null) {
            return;
        }
        composant.setPrixUnitaire(resolu.unitPrice());
        composant.setSourcePrix(
                StringUtils.hasText(resolu.priceSource()) ? resolu.priceSource() : CatalogPriceSource.MANUEL);
        composant.setPrixSourceRefId(resolu.sourceRefId());
        composant.setPrixDateSource(resolu.sourceDate());
        composant.setPrixCurrencyId(resolu.currencyId());
        composant.setPrixLibelleSource(resolu.sourceLabel());
        if (CatalogPriceSource.CONSULTE.equals(resolu.priceSource()) && resolu.sourceRefId() != null) {
            composant.setOffreFournisseurId(resolu.sourceRefId());
        }
        if (composant.getRendement() != null && composant.getPrixUnitaire() != null) {
            composant.setTotal(composant.getRendement().multiply(composant.getPrixUnitaire()));
        }
    }

    public void copierGelDepuisInput(ComposantDpu.ComposantDpuBuilder builder, ComposantDpuInputDto input) {
        if (input == null) {
            return;
        }
        builder.prixSourceRefId(input.getPrixSourceRefId());
        builder.prixDateSource(input.getPrixDateSource());
        builder.prixCurrencyId(input.getPrixCurrencyId());
        builder.prixLibelleSource(trimOrNull(input.getPrixLibelleSource()));
    }

    public static boolean isItem(String referenceType) {
        return ReferenceType.ITEM == ReferenceType.from(referenceType);
    }

    private static String trimOrNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
