package ma.nafura.catalogue.repository;

import ma.nafura.catalogue.domain.article.Item;
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
