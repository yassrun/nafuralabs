package ma.nafura.catalogue.repository;

import ma.nafura.catalogue.domain.article.UnitOfMeasure;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for UnitOfMeasure entity.
 */
@Repository
public interface UnitOfMeasureRepository extends TenantScopedRepository<UnitOfMeasure, UUID> {

    Optional<UnitOfMeasure> findByTenantIdAndUomCategoryIdAndEstBaseTrue(UUID tenantId, UUID uomCategoryId);

    Optional<UnitOfMeasure> findByTenantIdAndCodeIgnoreCase(UUID tenantId, String code);

    List<UnitOfMeasure> findByTenantIdAndUomCategoryId(UUID tenantId, UUID uomCategoryId);

    long countByTenantIdAndUomCategoryId(UUID tenantId, UUID uomCategoryId);
}
