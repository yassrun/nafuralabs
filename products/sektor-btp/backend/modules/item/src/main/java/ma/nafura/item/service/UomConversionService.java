package ma.nafura.item.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;
import java.util.UUID;
import ma.nafura.item.api.dto.UomConversionResultDto;
import ma.nafura.item.domain.model.UnitOfMeasure;
import ma.nafura.item.repository.UnitOfMeasureRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Conversion d'unités strictement intra-catégorie via facteur_vers_base.
 * Formule : q_to = q_from × (facteur_from / facteur_to).
 */
@Service
public class UomConversionService {

    private static final int SCALE = 8;

    private final UnitOfMeasureRepository repository;

    public UomConversionService(UnitOfMeasureRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public UomConversionResultDto convert(UUID fromUomId, UUID toUomId, BigDecimal quantity) {
        if (quantity == null) {
            throw new IllegalArgumentException("item.uom.conversion.quantity_required");
        }
        UUID tenantId = TenantContext.getTenantId();
        UnitOfMeasure from = repository
                .findByIdAndTenantId(fromUomId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("item.uom.conversion.from_not_found"));
        UnitOfMeasure to = repository
                .findByIdAndTenantId(toUomId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("item.uom.conversion.to_not_found"));
        return convert(from, to, quantity);
    }

    /**
     * Conversion pure (tests unitaires sans TenantContext).
     */
    public UomConversionResultDto convert(UnitOfMeasure from, UnitOfMeasure to, BigDecimal quantity) {
        if (from == null || to == null) {
            throw new IllegalArgumentException("item.uom.conversion.uom_required");
        }
        if (quantity == null) {
            throw new IllegalArgumentException("item.uom.conversion.quantity_required");
        }
        if (from.getUomCategoryId() == null || to.getUomCategoryId() == null) {
            throw new IllegalArgumentException("item.uom.conversion.category_required");
        }
        if (!Objects.equals(from.getUomCategoryId(), to.getUomCategoryId())) {
            throw new IllegalArgumentException("item.uom.conversion.cross_category");
        }
        BigDecimal facteurFrom = requirePositiveFacteur(from.getFacteurVersBase());
        BigDecimal facteurTo = requirePositiveFacteur(to.getFacteurVersBase());

        BigDecimal quantityTo = quantity
                .multiply(facteurFrom)
                .divide(facteurTo, SCALE, RoundingMode.HALF_UP);

        return UomConversionResultDto.builder()
                .fromUomId(from.getId())
                .fromCode(from.getCode())
                .toUomId(to.getId())
                .toCode(to.getCode())
                .quantityFrom(quantity)
                .quantityTo(quantityTo)
                .uomCategoryId(from.getUomCategoryId())
                .build();
    }

    private static BigDecimal requirePositiveFacteur(BigDecimal facteur) {
        if (facteur == null || facteur.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("item.uom.conversion.facteur_invalid");
        }
        return facteur;
    }
}
