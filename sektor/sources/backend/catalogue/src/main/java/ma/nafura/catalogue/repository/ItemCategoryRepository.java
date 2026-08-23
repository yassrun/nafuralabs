package ma.nafura.catalogue.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.catalogue.domain.article.ItemCategory;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for ItemCategory entity.
 * Generated once — add custom queries here.
 */
@Repository
public interface ItemCategoryRepository extends TenantScopedRepository<ItemCategory, UUID> {

    @Query(
            """
            SELECT c.id FROM ItemCategory c
            WHERE c.tenantId = :tenantId
              AND (c.id = :familleId OR c.parentId = :familleId)
            """)
    List<UUID> findSelfAndChildIds(@Param("tenantId") UUID tenantId, @Param("familleId") UUID familleId);
}
