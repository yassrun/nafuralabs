package ma.nafura.platform.collaboration.audit.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.platform.collaboration.audit.domain.model.AuditEvent;
import ma.nafura.platform.framework.record.RecordRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditEventRepository extends RecordRepository<AuditEvent> {

    Page<AuditEvent> findByTenantIdAndEntityTypeAndEntityIdOrderByEventAtDesc(
            UUID tenantId, String entityType, String entityId, Pageable pageable);

    long countByTenantId(UUID tenantId);

    @Query("SELECT DISTINCT e.entityType FROM AuditEvent e WHERE e.tenantId = :tenantId ORDER BY e.entityType")
    List<String> findDistinctEntityTypesByTenantId(@Param("tenantId") UUID tenantId);
}
