package ma.nafura.bc.demo.purchasing;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import ma.nafura.platform.framework.audit.Auditable;
import ma.nafura.platform.framework.domain.TenantEntity;
import ma.nafura.platform.framework.record.HasStatus;
import org.hibernate.annotations.Formula;

/** Draft → submitted → approved (by a lead above 10 000) → ordered: see lifecycle/purchase-request.json. */
@Entity(name = "DemoPurchaseRequest")
@Table(name = "demo_purchase_request")
@Auditable(
        entityType = "demo.purchase-request",
        trackedFields = {"subject", "supplierId", "amount", "neededBy", "status", "justification"})
@Getter
@Setter
public class PurchaseRequest extends TenantEntity implements HasStatus {

    @NotBlank
    @Size(max = 200)
    private String subject;

    @Column(name = "supplier_id")
    private UUID supplierId;

    @Setter(AccessLevel.NONE)
    @Formula("(select s.name from demo_supplier s where s.id = supplier_id)")
    private String supplierName;

    @DecimalMin("0")
    private BigDecimal amount;

    @Column(name = "needed_by")
    private LocalDate neededBy;

    @Size(max = 2000)
    private String justification;

    private String status;
}
