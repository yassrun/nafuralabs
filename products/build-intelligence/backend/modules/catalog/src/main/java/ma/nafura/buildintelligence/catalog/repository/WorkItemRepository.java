package ma.nafura.buildintelligence.catalog.repository;

import ma.nafura.buildintelligence.catalog.domain.WorkItem;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkItemRepository extends TenantScopedRepository<WorkItem, UUID> {

    Optional<WorkItem> findByTenantIdAndNormalizedDesignation(UUID tenantId, String normalizedDesignation);

    List<WorkItem> findByTenantIdAndNormalizedDesignationContainingIgnoreCase(UUID tenantId, String query);
}
