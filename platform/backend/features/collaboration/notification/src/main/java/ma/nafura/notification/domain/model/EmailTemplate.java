package ma.nafura.platform.collaboration.notification.domain.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Email template stored in DB with Thymeleaf variable substitution.
 * System templates (invitation, welcome) have tenantId null; custom templates are per-tenant.
 */
@Entity
@Table(name = "email_templates", indexes = {
    @Index(name = "idx_email_templates_tenant_code", columnList = "tenant_id, code"),
    @Index(name = "idx_email_templates_system", columnList = "is_system, code")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Null for system templates; required for custom templates. */
    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "code", nullable = false, length = 80)
    private String code;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "subject", nullable = false, length = 500)
    private String subject;

    @Column(name = "html_body", columnDefinition = "text")
    private String htmlBody;

    @Column(name = "text_body", columnDefinition = "text")
    private String textBody;

    /** Entity type for entity emails (e.g. "invoice"); null for system emails. */
    @Column(name = "entity_type", length = 80)
    private String entityType;

    @Column(name = "is_system", nullable = false)
    @Builder.Default
    private Boolean isSystem = false;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (this.createdAt == null) this.createdAt = now;
        if (this.updatedAt == null) this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
