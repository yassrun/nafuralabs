package ma.nafura.etudes.domain.dossier;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Job asynchrone d'extraction documentaire (bordereau ou indexation CPS).
 *
 * <p>Le résultat du bordereau reste un brouillon JSON jusqu'à validation utilisateur ;
 * l'indexation CPS persiste directement dans {@link CpsDocument} / {@link CpsSection}.
 */
@Entity
@Table(name = "document_extraction_jobs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentExtractionJob {

    public static final String TYPE_BORDEREAU_EXTRACT = "BORDEREAU_EXTRACT";
    public static final String TYPE_CPS_INDEX = "CPS_INDEX";

    public static final String STATUS_QUEUED = "QUEUED";
    public static final String STATUS_RUNNING = "RUNNING";
    public static final String STATUS_SUCCEEDED = "SUCCEEDED";
    public static final String STATUS_FAILED = "FAILED";
    public static final String STATUS_CANCELLED = "CANCELLED";

    public static final String EXTRACTOR_VERSION = "etudes-2.3.0-vision-assemble";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "dossier_etude_id", nullable = false)
    private UUID dossierEtudeId;

    @Column(name = "dossier_document_id", nullable = false)
    private UUID dossierDocumentId;

    @Column(name = "job_type", nullable = false, length = 40)
    private String jobType;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "progress_percent", nullable = false)
    @Builder.Default
    private Integer progressPercent = 0;

    @Column(name = "progress_step", length = 80)
    private String progressStep;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "result_json", columnDefinition = "jsonb")
    private Map<String, Object> resultJson;

    @Column(name = "error_code", length = 80)
    private String errorCode;

    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    @Column(name = "attempt_count", nullable = false)
    @Builder.Default
    private Integer attemptCount = 0;

    @Column(name = "max_attempts", nullable = false)
    @Builder.Default
    private Integer maxAttempts = 3;

    @Column(name = "available_at", nullable = false)
    private OffsetDateTime availableAt;

    @Column(name = "lease_owner", length = 100)
    private String leaseOwner;

    @Column(name = "lease_expires_at")
    private OffsetDateTime leaseExpiresAt;

    @Column(name = "content_hash", length = 64)
    private String contentHash;

    @Column(name = "extractor_version", nullable = false, length = 40)
    @Builder.Default
    private String extractorVersion = EXTRACTOR_VERSION;

    @Column(name = "idempotency_key", length = 200)
    private String idempotencyKey;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "started_at")
    private OffsetDateTime startedAt;

    @Column(name = "finished_at")
    private OffsetDateTime finishedAt;

    public boolean estTerminal() {
        return STATUS_SUCCEEDED.equals(status)
                || STATUS_FAILED.equals(status)
                || STATUS_CANCELLED.equals(status);
    }

    public boolean peutRelancer() {
        return STATUS_FAILED.equals(status)
                || STATUS_CANCELLED.equals(status)
                || STATUS_SUCCEEDED.equals(status);
    }

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (availableAt == null) {
            availableAt = now;
        }
        if (status == null) {
            status = STATUS_QUEUED;
        }
        if (progressPercent == null) {
            progressPercent = 0;
        }
        if (attemptCount == null) {
            attemptCount = 0;
        }
        if (maxAttempts == null) {
            maxAttempts = 3;
        }
        if (extractorVersion == null) {
            extractorVersion = EXTRACTOR_VERSION;
        }
    }
}
