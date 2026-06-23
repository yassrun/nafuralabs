package ma.nafura.item.repository;

import ma.nafura.item.domain.model.ItemType;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Repository for ItemType entity.
 * Generated once — add custom queries here.
 */
@Repository
public interface ItemTypeRepository extends TenantScopedRepository<ItemType, UUID> {
}
