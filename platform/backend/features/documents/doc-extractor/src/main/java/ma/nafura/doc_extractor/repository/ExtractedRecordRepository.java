package ma.nafura.platform.documents.docextractor.repository;

import ma.nafura.platform.documents.docextractor.domain.model.ExtractedRecord;
import ma.nafura.platform.documents.docextractor.domain.model.workflow.DocumentWorkflowStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExtractedRecordRepository extends JpaRepository<ExtractedRecord, UUID>, ExtractedRecordRepositoryCustom {

    /**
     * Find all records for a given session (domain + docType + version) within a tenant.
     */
    List<ExtractedRecord> findByTenantIdAndDomainKeyAndDocTypeKeyAndDocTypeVersionOrderByCreatedAtDesc(
            UUID tenantId,
            String domainKey,
            String docTypeKey,
            Integer docTypeVersion
    );

    /**
     * Find a record by its recordId (string UUID from frontend).
     */
    Optional<ExtractedRecord> findByRecordId(String recordId);

    /**
     * Find a record by recordId and tenantId for security.
     */
    Optional<ExtractedRecord> findByRecordIdAndTenantId(String recordId, UUID tenantId);

    /**
     * Find all records for a tenant.
     */
    List<ExtractedRecord> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    /**
     * Documents listing for Doc Extractor Documents page.
     * Filters are optional (pass nulls).
     */
    @Query("""
        SELECT r FROM ExtractedRecord r
        WHERE r.tenantId = :tenantId
          AND (:domainKey IS NULL OR r.domainKey = :domainKey)
          AND (:docTypeKey IS NULL OR r.docTypeKey = :docTypeKey)
          AND (:workflowStatus IS NULL OR r.workflowStatus = :workflowStatus)
        ORDER BY r.createdAt DESC
        """)
    Page<ExtractedRecord> findDocuments(
            @Param("tenantId") UUID tenantId,
            @Param("domainKey") String domainKey,
            @Param("docTypeKey") String docTypeKey,
            @Param("workflowStatus") DocumentWorkflowStatus workflowStatus,
            Pageable pageable
    );

    /**
     * Find a record by tenantId and sha256 for duplicate detection.
     */
    Optional<ExtractedRecord> findByTenantIdAndSha256(UUID tenantId, String sha256);

    /**
     * Find recent records with a non-null phash for a tenant.
     * Used for near-duplicate detection.
     */
    @org.springframework.data.jpa.repository.Query("SELECT r FROM ExtractedRecord r WHERE r.tenantId = :tenantId AND r.phash IS NOT NULL ORDER BY r.createdAt DESC")
    List<ExtractedRecord> findRecentWithPhash(UUID tenantId, org.springframework.data.domain.Pageable pageable);
}

