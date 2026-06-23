package ma.nafura.platform.collaboration.audit.repository;

import ma.nafura.platform.collaboration.audit.domain.model.AuditEvent;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AuditEventRepository extends TenantScopedRepository<AuditEvent, UUID> {

    Page<AuditEvent> findByTenantIdAndEntityTypeAndEntityIdOrderByEventAtDesc(
            UUID tenantId, String entityType, UUID entityId, Pageable pageable);

    @Query("SELECT DISTINCT e.entityType FROM AuditEvent e WHERE e.tenantId = :tenantId ORDER BY e.entityType")
    List<String> findDistinctEntityTypesByTenantId(@Param("tenantId") UUID tenantId);
}


