package ma.nafura.catalogue.repository;

import ma.nafura.catalogue.domain.model.ItemCategory;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Repository for ItemCategory entity.
 * Generated once — add custom queries here.
 */
@Repository
public interface ItemCategoryRepository extends TenantScopedRepository<ItemCategory, UUID> {
}
