package ma.nafura.platform.configuration.sysconfig.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ma.nafura.platform.framework.audit.Auditable;
import ma.nafura.platform.framework.domain.TenantEntity;

@Entity(name = "SysconfigTag")
@Table(name = "tag")
@Getter
@Setter
@NoArgsConstructor
@Auditable(entityType = "tag", trackedFields = {"code", "name", "color"})
public class Tag extends TenantEntity {

    @NotBlank
    @Size(max = 50)
    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @NotBlank
    @Size(max = 200)
    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Size(max = 20)
    @Column(name = "color", length = 20)
    private String color;
}
