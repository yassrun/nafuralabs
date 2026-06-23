package ma.nafura.item.repository;

import ma.nafura.item.domain.model.Item;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Repository for Item entity.
 * Generated once — add custom queries here.
 */
@Repository
public interface ItemRepository extends TenantScopedRepository<Item, UUID> {
}
