package ma.nafura.item.repository;

import ma.nafura.item.domain.model.ItemPrice;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Repository for ItemPrice entity.
 * Generated once — add custom queries here.
 */
@Repository
public interface ItemPriceRepository extends TenantScopedRepository<ItemPrice, UUID> {
}
