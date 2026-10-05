package ma.nafura.bc.demo.purchasing;

import java.math.BigDecimal;
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
import ma.nafura.platform.authorization.security.authorization.Confidential;
import ma.nafura.platform.authorization.security.authorization.PublicField;
import ma.nafura.platform.framework.domain.TenantEntity;
import org.hibernate.annotations.Formula;

@Entity(name = "DemoItem")
@Table(name = "demo_item")
@Getter
@Setter
public class Item extends TenantEntity {

    @PublicField
    @NotBlank
    @Size(max = 40)
    private String code;

    @PublicField
    @NotBlank
    @Size(max = 160)
    private String name;

    @Column(name = "category_id")
    private UUID categoryId;

    @PublicField
    @Setter(AccessLevel.NONE)
    @Formula("(select c.name from demo_category c where c.id = category_id)")
    private String categoryName;

    @PublicField
    @NotBlank
    @Size(max = 20)
    private String unit;

    @PublicField
    @Column(name = "unit_price")
    @DecimalMin("0")
    private BigDecimal unitPrice;

    private boolean active = true;

    @PublicField
    @Size(max = 2000)
    private String description;

    /** Listed on the public catalogue only when true. */
    private boolean published;

    /** Record-level condition: a confidential item never reaches the public catalogue. */
    @Confidential
    private boolean confidential;

    @PublicField
    @Size(max = 160)
    @Column(name = "supplier_name")
    private String supplierName;
}
