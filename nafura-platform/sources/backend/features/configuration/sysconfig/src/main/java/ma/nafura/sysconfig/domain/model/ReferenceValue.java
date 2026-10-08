package ma.nafura.platform.configuration.sysconfig.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ma.nafura.platform.framework.audit.Auditable;
import ma.nafura.platform.framework.domain.TenantEntity;

@Entity
@Table(name = "reference_value")
@Getter
@Setter
@NoArgsConstructor
@Auditable(entityType = "reference-value", trackedFields = {"code", "name", "codeListId", "sortOrder"})
public class ReferenceValue extends TenantEntity {

    @NotNull
    @Column(name = "code_list_id", nullable = false)
    private UUID codeListId;

    @NotBlank
    @Size(max = 50)
    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @NotBlank
    @Size(max = 200)
    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "sort_order")
    private Integer sortOrder;
}
