package ma.nafura.item.repository;

import ma.nafura.item.domain.model.UoMCategory;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Repository for UoMCategory entity.
 * Generated once — add custom queries here.
 */
@Repository
public interface UoMCategoryRepository extends TenantScopedRepository<UoMCategory, UUID> {
}
