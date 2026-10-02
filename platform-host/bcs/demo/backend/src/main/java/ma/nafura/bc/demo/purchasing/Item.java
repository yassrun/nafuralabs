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
import ma.nafura.platform.framework.domain.TenantEntity;
import org.hibernate.annotations.Formula;

@Entity(name = "DemoItem")
@Table(name = "demo_item")
@Getter
@Setter
public class Item extends TenantEntity {

    @NotBlank
    @Size(max = 40)
    private String code;

    @NotBlank
    @Size(max = 160)
    private String name;

    @Column(name = "category_id")
    private UUID categoryId;

    @Setter(AccessLevel.NONE)
    @Formula("(select c.name from demo_category c where c.id = category_id)")
    private String categoryName;

    @NotBlank
    @Size(max = 20)
    private String unit;

    @Column(name = "unit_price")
    @DecimalMin("0")
    private BigDecimal unitPrice;

    private boolean active = true;

    @Size(max = 2000)
    private String description;
}
