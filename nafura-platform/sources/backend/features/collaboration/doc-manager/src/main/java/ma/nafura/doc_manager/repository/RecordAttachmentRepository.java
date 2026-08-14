package ma.nafura.platform.collaboration.docmanager.repository;

import ma.nafura.platform.collaboration.docmanager.domain.model.RecordAttachment;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RecordAttachmentRepository extends TenantScopedRepository<RecordAttachment, UUID> {

    Page<RecordAttachment> findByTenantIdAndEntityTypeAndEntityIdOrderByCreatedAtDesc(
            UUID tenantId, String entityType, String entityId, Pageable pageable);

    long countByTenantIdAndEntityTypeAndEntityId(UUID tenantId, String entityType, String entityId);

    @Query("SELECT COALESCE(SUM(a.sizeBytes), 0) FROM RecordAttachment a WHERE a.tenantId = :tenantId")
    Long sumSizeBytesByTenantId(UUID tenantId);

    @Query("SELECT COALESCE(SUM(a.sizeBytes), 0) FROM RecordAttachment a")
    Long sumSizeBytes();

    @Query("SELECT a.tenantId, COALESCE(SUM(a.sizeBytes), 0) FROM RecordAttachment a " +
           "WHERE a.tenantId IS NOT NULL GROUP BY a.tenantId")
    List<Object[]> sumSizeBytesGroupedByTenant();
}


