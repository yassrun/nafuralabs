package ma.nafura.etudes.service;

import java.time.LocalDate;
import java.util.UUID;
import ma.nafura.etudes.api.request.ComposantDpuInputDto;
import ma.nafura.etudes.domain.ReferenceType;
import ma.nafura.etudes.domain.model.ComposantDpu;
import ma.nafura.item.domain.SourcePrix;
import ma.nafura.item.service.prix.ContexteResolution;
import ma.nafura.item.service.prix.PrixResolu;
import ma.nafura.item.service.prix.ResolutionPrixService;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Branche {@link ResolutionPrixService} sur les composants DPU ITEM et gèle le résultat (L5).
 * Ne modifie pas le service de résolution lui-même.
 */
@Service
public class GelPrixComposantService {

    private final ResolutionPrixService resolutionPrixService;
    private final ParametresEtudeService parametres;

    public GelPrixComposantService(
            ResolutionPrixService resolutionPrixService, ParametresEtudeService parametres) {
        this.resolutionPrixService = resolutionPrixService;
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

    public PrixResolu resoudre(UUID itemId) {
        if (itemId == null) {
            return null;
        }
        ContexteResolution ctx = new ContexteResolution(
                TenantContext.getTenantId(),
                LocalDate.now(),
                null,
                null,
                null,
                parametres.basePrixChiffrage());
        return resolutionPrixService.resoudrePrixAchat(itemId, ctx);
    }

    /**
     * Applique un {@link PrixResolu} sur le builder / entité — snapshot figé.
     */
    public void appliquerGel(ComposantDpu.ComposantDpuBuilder builder, PrixResolu resolu) {
        if (resolu == null || resolu.prixUnitaire() == null) {
            return;
        }
        builder.prixUnitaire(resolu.prixUnitaire());
        builder.sourcePrix(StringUtils.hasText(resolu.sourcePrix()) ? resolu.sourcePrix() : SourcePrix.MANUEL);
        builder.prixSourceRefId(resolu.sourceRefId());
        builder.prixDateSource(resolu.dateSource());
        builder.prixCurrencyId(resolu.currencyId());
        builder.prixLibelleSource(resolu.libelleSource());
        if (SourcePrix.CONSULTE.equals(resolu.sourcePrix()) && resolu.sourceRefId() != null) {
            builder.offreFournisseurId(resolu.sourceRefId());
        }
    }

    public void appliquerGel(ComposantDpu composant, PrixResolu resolu) {
        if (composant == null || resolu == null || resolu.prixUnitaire() == null) {
            return;
        }
        composant.setPrixUnitaire(resolu.prixUnitaire());
        composant.setSourcePrix(
                StringUtils.hasText(resolu.sourcePrix()) ? resolu.sourcePrix() : SourcePrix.MANUEL);
        composant.setPrixSourceRefId(resolu.sourceRefId());
        composant.setPrixDateSource(resolu.dateSource());
        composant.setPrixCurrencyId(resolu.currencyId());
        composant.setPrixLibelleSource(resolu.libelleSource());
        if (SourcePrix.CONSULTE.equals(resolu.sourcePrix()) && resolu.sourceRefId() != null) {
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
