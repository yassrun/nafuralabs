package ma.nafura.platform.hosttests.probe;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import ma.nafura.platform.framework.domain.TenantEntity;

@Entity(name = "ProbeGroup")
@Table(name = "probe_group")
@Getter
@Setter
public class ProbeGroup extends TenantEntity {

    @NotBlank
    @Size(max = 40)
    private String code;

    @NotBlank
    @Size(max = 120)
    private String name;
}
