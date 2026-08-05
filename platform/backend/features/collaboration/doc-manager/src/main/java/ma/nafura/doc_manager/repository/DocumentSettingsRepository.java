package ma.nafura.platform.collaboration.docmanager.repository;

import ma.nafura.platform.collaboration.docmanager.domain.model.DocumentSettings;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentSettingsRepository extends TenantScopedRepository<DocumentSettings, UUID> {

    /** Tenant-wide defaults (entity_type IS NULL). */
    Optional<DocumentSettings> findByTenantIdAndEntityTypeIsNull(UUID tenantId);

    Optional<DocumentSettings> findByTenantIdAndEntityType(UUID tenantId, String entityType);
}
