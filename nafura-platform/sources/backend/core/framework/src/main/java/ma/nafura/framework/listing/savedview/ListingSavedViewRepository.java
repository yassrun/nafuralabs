package ma.nafura.platform.framework.listing.savedview;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ListingSavedViewRepository extends TenantScopedRepository<ListingSavedView, UUID> {

    List<ListingSavedView> findByTenantIdAndOwnerUserIdAndResourceKeyOrderByNameAsc(
            UUID tenantId, UUID ownerUserId, String resourceKey);

    Optional<ListingSavedView> findByIdAndTenantIdAndOwnerUserId(UUID id, UUID tenantId, UUID ownerUserId);

    Optional<ListingSavedView> findByTenantIdAndOwnerUserIdAndResourceKeyAndIsDefaultTrue(
            UUID tenantId, UUID ownerUserId, String resourceKey);
}
