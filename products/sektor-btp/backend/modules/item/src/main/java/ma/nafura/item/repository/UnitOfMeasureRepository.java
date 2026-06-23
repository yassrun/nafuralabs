package ma.nafura.item.repository;

import ma.nafura.item.domain.model.UnitOfMeasure;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Repository for UnitOfMeasure entity.
 * Generated once — add custom queries here.
 */
@Repository
public interface UnitOfMeasureRepository extends TenantScopedRepository<UnitOfMeasure, UUID> {
}
