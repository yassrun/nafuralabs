package ma.nafura.platform.collaboration.docmanager.domain.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "document_templates")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "code", nullable = false, length = 60)
    private String code;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "entity_type", nullable = false, length = 80)
    private String entityType;

    @Column(name = "format", nullable = false, length = 20)
    private String format;

    @Column(name = "template_body", columnDefinition = "text")
    private String templateBody;

    /** System template (read-only for tenants). */
    @Column(name = "is_system", nullable = false)
    @Builder.Default
    private Boolean isSystem = false;

    @Column(name = "paper_size", length = 20)
    private String paperSize;

    @Column(name = "orientation", length = 20)
    private String orientation;

    @Column(name = "margins_css", length = 80)
    private String marginsCss;

    /** JSON config (header/footer toggles, etc.). */
    @Column(name = "metadata", columnDefinition = "text")
    private String metadata;

    @Column(name = "is_default")
    private Boolean isDefault;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}

