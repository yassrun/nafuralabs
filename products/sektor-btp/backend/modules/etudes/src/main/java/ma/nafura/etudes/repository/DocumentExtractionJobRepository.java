package ma.nafura.etudes.repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.model.DocumentExtractionJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DocumentExtractionJobRepository extends JpaRepository<DocumentExtractionJob, UUID> {

    Optional<DocumentExtractionJob> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<DocumentExtractionJob> findByTenantIdAndIdempotencyKey(UUID tenantId, String idempotencyKey);

    List<DocumentExtractionJob> findByTenantIdAndDossierEtudeIdOrderByCreatedAtDesc(
            UUID tenantId, UUID dossierEtudeId);

    Optional<DocumentExtractionJob> findFirstByTenantIdAndDossierDocumentIdAndJobTypeOrderByCreatedAtDesc(
            UUID tenantId, UUID dossierDocumentId, String jobType);

    /**
     * Claim atomique d'un job prêt : statut QUEUED (ou lease expiré) et available_at passé.
     * SKIP LOCKED permet à plusieurs workers de poller sans se bloquer.
     */
    @Query(value = """
            SELECT id FROM document_extraction_jobs
            WHERE status IN ('QUEUED', 'RUNNING')
              AND available_at <= :now
              AND (lease_expires_at IS NULL OR lease_expires_at < :now)
            ORDER BY available_at ASC
            FOR UPDATE SKIP LOCKED
            LIMIT 1
            """, nativeQuery = true)
    Optional<UUID> findNextClaimableId(@Param("now") OffsetDateTime now);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
            UPDATE document_extraction_jobs
            SET status = 'RUNNING',
                lease_owner = :owner,
                lease_expires_at = :leaseExpiresAt,
                started_at = COALESCE(started_at, :now),
                attempt_count = attempt_count + 1,
                progress_step = 'running',
                progress_percent = GREATEST(progress_percent, 5)
            WHERE id = :id
              AND status IN ('QUEUED', 'RUNNING')
              AND available_at <= :now
              AND (lease_expires_at IS NULL OR lease_expires_at < :now)
            """, nativeQuery = true)
    int claim(
            @Param("id") UUID id,
            @Param("owner") String owner,
            @Param("now") OffsetDateTime now,
            @Param("leaseExpiresAt") OffsetDateTime leaseExpiresAt);

    @Modifying(clearAutomatically = true)
    @Query(value = """
            UPDATE document_extraction_jobs
            SET lease_expires_at = :leaseExpiresAt
            WHERE id = :id
              AND status = 'RUNNING'
              AND lease_owner = :owner
            """, nativeQuery = true)
    int renewLease(
            @Param("id") UUID id,
            @Param("owner") String owner,
            @Param("leaseExpiresAt") OffsetDateTime leaseExpiresAt);
}
