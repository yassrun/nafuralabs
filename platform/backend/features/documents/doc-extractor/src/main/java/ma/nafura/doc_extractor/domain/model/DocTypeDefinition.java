package ma.nafura.platform.documents.docextractor.domain.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "doc_type_definition",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "unique_doc_type_definition",
            columnNames = {"domain_key", "doc_type_key", "version"}
        )
    },
    indexes = {
        @Index(name = "idx_doc_type_def_domain_key", columnList = "domain_key"),
        @Index(name = "idx_doc_type_def_doc_type_key", columnList = "doc_type_key"),
        @Index(name = "idx_doc_type_def_version", columnList = "version"),
        @Index(name = "idx_doc_type_def_status", columnList = "status")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocTypeDefinition {

    /**
     * Version status enum for workflow control.
     * - DRAFT: Editable, not yet published
     * - PUBLISHED: Immutable, active for use in extraction
     * - DEPRECATED: Immutable, no longer active but kept for history
     */
    public enum Status {
        DRAFT,
        PUBLISHED,
        DEPRECATED
    }

    /**
     * Origin enum to distinguish system-provided vs tenant-created doc types.
     * - SYSTEM: Provided by Doxura product, read-only for tenants
     * - TENANT: Created or customized by a specific tenant
     */
    public enum Origin {
        SYSTEM,
        TENANT
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "domain_key", nullable = false, length = 80)
    private String domainKey; // ex: "insurance_health"

    @Column(name = "doc_type_key", nullable = false, length = 80)
    private String docTypeKey; // ex: "medical_invoice"

    @Column(name = "version", nullable = false)
    private Integer version; // starts at 1

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "prompt_template", nullable = false, columnDefinition = "TEXT")
    private String promptTemplate;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "json_schema", nullable = false, columnDefinition = "JSONB")
    private String jsonSchema; // Stored as JSONB in DB, but accessed as String in Java

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ui_schema", columnDefinition = "JSONB")
    private String uiSchema; // UI rendering hints

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "builder_state", columnDefinition = "JSONB")
    private String builderState; // Canonical builder state for drafts, used to generate schemas

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "excel_mapping", columnDefinition = "JSONB")
    private String excelMapping; // Reserved for later

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.DRAFT;

    /**
     * Origin of the doc type: SYSTEM (Doxura-provided) or TENANT (user-created).
     * SYSTEM types are read-only for tenants, TENANT types are fully editable.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "origin", nullable = false, length = 20)
    @Builder.Default
    private Origin origin = Origin.TENANT;

    /**
     * Tenant ID for TENANT-origin doc types.
     * NULL for SYSTEM types (visible to all tenants).
     * Populated for TENANT types (scoped to specific tenant).
     */
    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "created_by", length = 120)
    private String createdBy;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "updated_by", length = 120)
    private String updatedBy;

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

    /**
     * Check if this version is editable (only drafts can be edited).
     */
    public boolean isEditable() {
        return status == Status.DRAFT;
    }

    /**
     * Check if this version can be used for extraction (only published).
     */
    public boolean isUsableForExtraction() {
        return status == Status.PUBLISHED;
    }

    /**
     * Check if this doc type can be modified by a tenant.
     * SYSTEM types are read-only, TENANT types in DRAFT status can be edited.
     */
    public boolean isEditableByTenant() {
        return origin == Origin.TENANT && status == Status.DRAFT;
    }

    /**
     * Check if this is a system-provided doc type.
     */
    public boolean isSystemProvided() {
        return origin == Origin.SYSTEM;
    }
}

