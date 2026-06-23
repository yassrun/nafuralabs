package ma.nafura.platform.documents.docextractor.domain.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import ma.nafura.platform.documents.docextractor.domain.model.workflow.DocumentWorkflowStatus;
import ma.nafura.platform.documents.docextractor.domain.model.workflow.ValidationState;
import ma.nafura.platform.documents.docextractor.domain.model.workflow.CompletenessState;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(
    name = "extracted_record",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "unique_extracted_record_id",
            columnNames = {"record_id"}
        )
    },
    indexes = {
        @Index(name = "idx_extracted_record_tenant", columnList = "tenant_id"),
        @Index(name = "idx_extracted_record_session", columnList = "domain_key,doc_type_key,doc_type_version"),
        @Index(name = "idx_extracted_record_tenant_session", columnList = "tenant_id,domain_key,doc_type_key,doc_type_version"),
        @Index(name = "idx_extracted_record_record_id", columnList = "record_id")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExtractedRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "record_id", nullable = false, unique = true, length = 255)
    private String recordId; // String UUID from frontend

    @Column(name = "domain_key", nullable = false, length = 80)
    private String domainKey;

    @Column(name = "doc_type_key", nullable = false, length = 80)
    private String docTypeKey;

    @Column(name = "doc_type_version", nullable = false)
    private Integer docTypeVersion;

    /**
     * Direct reference to the exact DocTypeDefinition version used.
     * Allows precise schema lookup for record rendering.
     */
    @Column(name = "doc_type_definition_id")
    private UUID docTypeDefinitionId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "data_json", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> dataJson;

    /**
     * Legacy status field (kept for backward compatibility).
     * Use workflowStatus for new code.
     * @deprecated Use workflowStatus instead
     */
    @Deprecated
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "draft";

    /**
     * Primary workflow status.
     * Represents the main state of the document (DRAFT, VALIDATED, REJECTED).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "workflow_status", nullable = false, length = 20)
    @Builder.Default
    private DocumentWorkflowStatus workflowStatus = DocumentWorkflowStatus.DRAFT;

    /**
     * Validation state (secondary state, only relevant for DRAFT).
     * Describes whether the document data meets validation requirements.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "validation_state", length = 20)
    private ValidationState validationState;

    /**
     * Completeness state (secondary state, only relevant for DRAFT).
     * Describes whether all fields (required and optional) are filled.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "completeness_state", length = 20)
    private CompletenessState completenessState;

    /**
     * Number of validation errors (only when validationState = INVALID).
     */
    @Column(name = "error_count")
    private Integer errorCount;

    /**
     * Rejection reason (only when workflowStatus = REJECTED).
     */
    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "stored_document_id")
    private UUID storedDocumentId;

    /**
     * Source file metadata (persisted even when the binary is not stored in MinIO).
     */
    @Column(name = "source_file_name", length = 512)
    private String sourceFileName;

    @Column(name = "source_mime_type", length = 255)
    private String sourceMimeType;

    @Column(name = "source_file_size_bytes")
    private Long sourceFileSizeBytes;

    @Column(name = "sha256", nullable = false, length = 64)
    private String sha256;

    @Column(name = "phash")
    private Long phash;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}

