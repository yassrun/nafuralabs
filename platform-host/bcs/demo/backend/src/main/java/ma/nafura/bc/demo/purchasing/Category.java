package ma.nafura.bc.demo.purchasing;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import ma.nafura.platform.framework.domain.TenantEntity;

/** Purchase category: a tree (IT › Laptops). */
@Entity(name = "DemoCategory")
@Table(name = "demo_category")
@Getter
@Setter
public class Category extends TenantEntity {

    @NotBlank
    @Size(max = 40)
    private String code;

    @NotBlank
    @Size(max = 120)
    private String name;

    @Column(name = "parent_id")
    private UUID parentId;

    @Size(max = 500)
    private String description;
}
