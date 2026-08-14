package ma.nafura.catalogue.repository;

import ma.nafura.catalogue.domain.article.UoMCategory;
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
