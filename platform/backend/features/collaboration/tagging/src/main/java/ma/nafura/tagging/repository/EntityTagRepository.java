package ma.nafura.platform.collaboration.tagging.repository;

import ma.nafura.platform.collaboration.tagging.domain.model.EntityTag;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EntityTagRepository extends TenantScopedRepository<EntityTag, UUID> {

    List<EntityTag> findByTenantIdAndEntityTypeAndEntityId(UUID tenantId, String entityType, UUID entityId);

    Optional<EntityTag> findByTenantIdAndEntityTypeAndEntityIdAndTagId(
            UUID tenantId, String entityType, UUID entityId, UUID tagId);
}


