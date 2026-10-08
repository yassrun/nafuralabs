package ma.nafura.platform.collaboration.docmanager.domain.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ma.nafura.platform.framework.audit.Auditable;
import ma.nafura.platform.framework.domain.TenantEntity;
import org.hibernate.annotations.Formula;

@Entity
@Table(name = "document_templates")
@Getter
@Setter
@NoArgsConstructor
@Auditable(entityType = "document-template", trackedFields = {"code", "name", "entityType"})
public class DocumentTemplate extends TenantEntity {

    @NotBlank
    @Size(max = 60)
    @Column(name = "code", nullable = false, length = 60)
    private String code;

    @NotBlank
    @Size(max = 200)
    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @NotBlank
    @Size(max = 80)
    @Column(name = "entity_type", nullable = false, length = 80)
    private String entityType;

    @NotBlank
    @Size(max = 20)
    @Column(name = "format", nullable = false, length = 20)
    private String format = "pdf";

    @Column(name = "template_body", columnDefinition = "text")
    private String templateBody;

    /** System template (read-only for tenants). */
    @Column(name = "is_system", nullable = false)
    private Boolean isSystem = false;

    @Size(max = 20)
    @Column(name = "paper_size", length = 20)
    private String paperSize;

    @Size(max = 20)
    @Column(name = "orientation", length = 20)
    private String orientation;

    @Size(max = 80)
    @Column(name = "margins_css", length = 80)
    private String marginsCss;

    /** JSON config (header/footer toggles, etc.). */
    @Column(name = "metadata", columnDefinition = "text")
    private String metadata;

    @Column(name = "is_default")
    private Boolean isDefault;

    @Column(name = "is_active")
    private Boolean isActive;

    @Setter(AccessLevel.NONE)
    @Formula("case when is_system = true then 'Système' else 'Personnalisé' end")
    private String typeLabel;

    /** Create-from-clone helper; not persisted. */
    @Transient
    @JsonProperty("cloneFromId")
    private UUID cloneFromId;
}
