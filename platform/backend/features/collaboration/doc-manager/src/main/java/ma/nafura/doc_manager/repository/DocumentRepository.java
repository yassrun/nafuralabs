package ma.nafura.platform.collaboration.docmanager.repository;

import ma.nafura.platform.collaboration.docmanager.domain.model.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository("docManagerDocumentRepository")
public interface DocumentRepository extends JpaRepository<Document, UUID> {
    
    Optional<Document> findByIdAndTenantId(UUID id, UUID tenantId);
    
    List<Document> findByTenantId(UUID tenantId);
    
    boolean existsByIdAndTenantId(UUID id, UUID tenantId);

    @Query("SELECT COALESCE(SUM(d.fileSizeBytes), 0) FROM Document d WHERE d.tenantId = :tenantId")
    Long sumFileSizeBytesByTenantId(UUID tenantId);

    @Query("SELECT COALESCE(SUM(d.fileSizeBytes), 0) FROM Document d")
    Long sumFileSizeBytes();

    @Query("SELECT d.tenantId, COALESCE(SUM(d.fileSizeBytes), 0) FROM Document d " +
           "WHERE d.tenantId IS NOT NULL GROUP BY d.tenantId")
    List<Object[]> sumFileSizeBytesGroupedByTenant();
}

