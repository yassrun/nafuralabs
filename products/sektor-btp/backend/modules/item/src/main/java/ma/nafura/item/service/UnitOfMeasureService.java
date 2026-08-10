package ma.nafura.item.service;

import java.math.BigDecimal;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.item.api.request.UnitOfMeasureCreateDto;
import ma.nafura.item.api.request.UnitOfMeasureUpdateDto;
import ma.nafura.item.domain.model.UnitOfMeasure;
import ma.nafura.item.mapper.UnitOfMeasureMapper;
import ma.nafura.item.repository.UnitOfMeasureRepository;
import ma.nafura.item.service.base.UnitOfMeasureServiceBase;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Custom service for UnitOfMeasure — facteur vers base + unicité de la base.
 */
@Service
public class UnitOfMeasureService extends UnitOfMeasureServiceBase {

    private final UnitOfMeasureRepository unitOfMeasureRepository;

    public UnitOfMeasureService(UnitOfMeasureRepository repository, UnitOfMeasureMapper mapper) {
        super(repository, mapper);
        this.unitOfMeasureRepository = repository;
    }

    @Override
    @Transactional
    public UnitOfMeasure create(UnitOfMeasureCreateDto request) {
        normalizeCreateDefaults(request);
        validateFacteur(request.getFacteurVersBase());
        validateBaseRequiresCategory(request.getEstBase(), request.getUomCategoryId());
        if (Boolean.TRUE.equals(request.getEstBase())) {
            request.setFacteurVersBase(BigDecimal.ONE);
        }
        ensureCategoryHasOrGetsBase(
                TenantContext.getTenantId(),
                request.getUomCategoryId(),
                Boolean.TRUE.equals(request.getEstBase()),
                null);
        if (Boolean.TRUE.equals(request.getEstBase()) && request.getUomCategoryId() != null) {
            clearOtherBases(TenantContext.getTenantId(), request.getUomCategoryId(), null);
        }
        return super.create(request);
    }

    @Override
    @Transactional
    public UnitOfMeasure update(UUID id, UnitOfMeasureUpdateDto request) {
        UnitOfMeasure existing = getByIdOrThrow(id);
        UUID tenantId = existing.getTenantId();

        Boolean nextEstBase = request.getEstBase() != null ? request.getEstBase() : existing.getEstBase();
        UUID nextCategoryId =
                request.getUomCategoryId() != null ? request.getUomCategoryId() : existing.getUomCategoryId();

        if (request.getFacteurVersBase() != null) {
            validateFacteur(request.getFacteurVersBase());
        }
        validateBaseRequiresCategory(nextEstBase, nextCategoryId);

        if (Boolean.TRUE.equals(nextEstBase)) {
            request.setFacteurVersBase(BigDecimal.ONE);
        }

        ensureCategoryHasOrGetsBase(tenantId, nextCategoryId, Boolean.TRUE.equals(nextEstBase), id);

        boolean becomingBase = Boolean.TRUE.equals(nextEstBase);
        boolean wasBase = Boolean.TRUE.equals(existing.getEstBase());
        boolean categoryChanged = !Objects.equals(existing.getUomCategoryId(), nextCategoryId);

        if (becomingBase && nextCategoryId != null) {
            clearOtherBases(tenantId, nextCategoryId, id);
        }

        if (wasBase && !becomingBase && existing.getUomCategoryId() != null) {
            long siblings = unitOfMeasureRepository.countByTenantIdAndUomCategoryId(
                    tenantId, existing.getUomCategoryId());
            if (siblings > 1) {
                throw new IllegalArgumentException("item.uom.base.required_in_category");
            }
        }

        if (wasBase && categoryChanged && existing.getUomCategoryId() != null) {
            long siblingsInOld = unitOfMeasureRepository.countByTenantIdAndUomCategoryId(
                    tenantId, existing.getUomCategoryId());
            if (siblingsInOld > 1) {
                Optional<UnitOfMeasure> otherBase =
                        unitOfMeasureRepository.findByTenantIdAndUomCategoryIdAndEstBaseTrue(
                                tenantId, existing.getUomCategoryId());
                if (otherBase.isEmpty() || otherBase.get().getId().equals(id)) {
                    throw new IllegalArgumentException("item.uom.base.required_in_category");
                }
            }
        }

        return super.update(id, request);
    }

    private void normalizeCreateDefaults(UnitOfMeasureCreateDto request) {
        if (request.getFacteurVersBase() == null) {
            request.setFacteurVersBase(BigDecimal.ONE);
        }
        if (request.getEstBase() == null) {
            request.setEstBase(false);
        }
    }

    private void validateFacteur(BigDecimal facteur) {
        if (facteur == null || facteur.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("item.uom.facteur.must_be_positive");
        }
    }

    private void validateBaseRequiresCategory(Boolean estBase, UUID categoryId) {
        if (Boolean.TRUE.equals(estBase) && categoryId == null) {
            throw new IllegalArgumentException("item.uom.base.category_required");
        }
    }

    /**
     * Une catégorie utilisée doit avoir une unité de base.
     * Créer une unité non-base dans une catégorie sans base → refus.
     */
    private void ensureCategoryHasOrGetsBase(
            UUID tenantId, UUID categoryId, boolean thisIsBase, UUID excludeId) {
        if (categoryId == null) {
            return;
        }
        if (thisIsBase) {
            return;
        }
        Optional<UnitOfMeasure> base =
                unitOfMeasureRepository.findByTenantIdAndUomCategoryIdAndEstBaseTrue(tenantId, categoryId);
        if (base.isPresent() && (excludeId == null || !base.get().getId().equals(excludeId))) {
            return;
        }
        // No other base in category
        throw new IllegalArgumentException("item.uom.base.category_without_base");
    }

    private void clearOtherBases(UUID tenantId, UUID categoryId, UUID keepId) {
        for (UnitOfMeasure uom :
                unitOfMeasureRepository.findByTenantIdAndUomCategoryId(tenantId, categoryId)) {
            if (Boolean.TRUE.equals(uom.getEstBase())
                    && (keepId == null || !uom.getId().equals(keepId))) {
                uom.setEstBase(false);
                unitOfMeasureRepository.save(uom);
            }
        }
    }
}
