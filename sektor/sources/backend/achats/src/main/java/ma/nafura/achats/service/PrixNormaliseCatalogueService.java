package ma.nafura.achats.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;
import ma.nafura.achats.domain.model.CatalogueFournisseurLigne;
import ma.nafura.catalogue.domain.model.UnitOfMeasure;
import ma.nafura.catalogue.repository.UnitOfMeasureRepository;
import ma.nafura.catalogue.service.UomConversionService;
import org.springframework.stereotype.Service;

/**
 * Calcule {@code prix_normalise} à partir du prix commercial net et du conditionnement.
 * Jamais saisi — toujours recalculé à l'écriture.
 */
@Service
public class PrixNormaliseCatalogueService {

    private static final int SCALE = 8;

    private final UnitOfMeasureRepository uomRepository;
    private final UomConversionService uomConversionService;

    public PrixNormaliseCatalogueService(
            UnitOfMeasureRepository uomRepository, UomConversionService uomConversionService) {
        this.uomRepository = uomRepository;
        this.uomConversionService = uomConversionService;
    }

    /**
     * Applique le prix normalisé sur l'entité. Sans conditionnement valide : champs normalisés
     * remis à null (le prix commercial reste inchangé).
     */
    public void apply(CatalogueFournisseurLigne ligne) {
        ligne.setPrixNormalise(null);
        ligne.setUomNormaliseId(null);

        BigDecimal qty = ligne.getConditionnementQuantite();
        UUID condUomId = ligne.getConditionnementUomId();
        if (qty == null || qty.compareTo(BigDecimal.ZERO) <= 0 || condUomId == null) {
            return;
        }
        if (ligne.getTenantId() == null) {
            throw new IllegalArgumentException("achats.catalogue.tenant_required");
        }

        UnitOfMeasure condUom = uomRepository
                .findByIdAndTenantId(condUomId, ligne.getTenantId())
                .orElseThrow(() -> new IllegalArgumentException("achats.catalogue.conditionnement_uom_introuvable"));
        if (condUom.getUomCategoryId() == null) {
            throw new IllegalArgumentException("achats.catalogue.conditionnement_sans_categorie");
        }

        UnitOfMeasure base = uomRepository
                .findByTenantIdAndUomCategoryIdAndEstBaseTrue(ligne.getTenantId(), condUom.getUomCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("achats.catalogue.uom_base_introuvable"));

        BigDecimal qtyBase = uomConversionService.convert(condUom, base, qty).getQuantityTo();
        if (qtyBase.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("achats.catalogue.conditionnement_qty_invalide");
        }

        BigDecimal prixNet = ligne.prixNetHt();
        ligne.setPrixNormalise(prixNet.divide(qtyBase, SCALE, RoundingMode.HALF_UP));
        ligne.setUomNormaliseId(base.getId());
    }
}
