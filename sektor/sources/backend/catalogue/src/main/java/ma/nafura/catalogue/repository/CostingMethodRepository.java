package ma.nafura.catalogue.repository;

import ma.nafura.catalogue.domain.stock.CostingMethod;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Repository for CostingMethod entity.
 * Generated once — add custom queries here.
 */
@Repository
public interface CostingMethodRepository extends TenantScopedRepository<CostingMethod, UUID> {
}
