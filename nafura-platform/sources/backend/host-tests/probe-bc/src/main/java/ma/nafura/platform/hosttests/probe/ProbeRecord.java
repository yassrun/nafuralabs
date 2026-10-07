package ma.nafura.platform.hosttests.probe;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import ma.nafura.platform.framework.domain.TenantEntity;
import ma.nafura.platform.framework.record.HasStatus;

@Entity(name = "ProbeRecord")
@Table(name = "probe_record")
@Getter
@Setter
public class ProbeRecord extends TenantEntity implements HasStatus {

    @NotBlank
    @Size(max = 40)
    private String code;

    @Column(name = "group_id")
    private UUID groupId;

    @DecimalMin("0")
    private BigDecimal amount;

    private String status;

    /** Set by the controller (beforeSave), never by a request body (readOnlyFields). */
    @Size(max = 60)
    private String reference;
}
