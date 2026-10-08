package ma.nafura.platform.collaboration.notification.domain.model;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ma.nafura.platform.framework.domain.TenantEntity;
import org.hibernate.annotations.Formula;

/**
 * Email template stored in DB with Thymeleaf variable substitution.
 * System templates ({@code tenantId} null) are shared; custom templates are per-tenant.
 */
@Entity
@Table(name = "email_templates", indexes = {
    @jakarta.persistence.Index(name = "idx_email_templates_tenant_code", columnList = "tenant_id, code"),
    @jakarta.persistence.Index(name = "idx_email_templates_system", columnList = "is_system, code")
})
@AttributeOverride(name = "tenantId", column = @Column(name = "tenant_id", nullable = true))
@Getter
@Setter
@NoArgsConstructor
public class EmailTemplate extends TenantEntity {

    @NotBlank
    @Size(max = 80)
    @Column(name = "code", nullable = false, length = 80)
    private String code;

    @NotBlank
    @Size(max = 200)
    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @NotBlank
    @Size(max = 500)
    @Column(name = "subject", nullable = false, length = 500)
    private String subject;

    @Column(name = "html_body", columnDefinition = "text")
    private String htmlBody;

    @Column(name = "text_body", columnDefinition = "text")
    private String textBody;

    /** Entity type for entity emails (e.g. "invoice"); null for system emails. */
    @Size(max = 80)
    @Column(name = "entity_type", length = 80)
    private String entityType;

    @Column(name = "is_system", nullable = false)
    private Boolean isSystem = false;

    @Setter(AccessLevel.NONE)
    @Formula("case when is_system = true then 'Système' else 'Personnalisé' end")
    private String typeLabel;
}
