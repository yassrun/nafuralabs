package ma.nafura.bc.demo.purchasing;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import ma.nafura.platform.framework.domain.TenantEntity;
import ma.nafura.platform.framework.validation.Ice;
import ma.nafura.platform.framework.validation.PhoneMa;
import ma.nafura.platform.framework.validation.Rib;
import org.hibernate.annotations.Formula;

@Entity(name = "DemoSupplier")
@Table(name = "demo_supplier")
@Getter
@Setter
public class Supplier extends TenantEntity {

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

    @Email
    @Size(max = 160)
    private String email;

    @PhoneMa
    @Size(max = 20)
    private String phone;

    @Ice
    @Size(max = 15)
    private String ice;

    @Rib
    @Size(max = 24)
    private String rib;

    @Size(max = 80)
    private String city;

    @Size(max = 300)
    private String address;

    /** ISO 3166-1 alpha-2; {@code MA} hides the International section on the record page. */
    @Size(min = 2, max = 2)
    private String country = "MA";

    @Column(name = "vat_number")
    @Size(max = 40)
    private String vatNumber;

    private boolean active = true;

    @Column(name = "payment_terms")
    @Size(max = 20)
    private String paymentTerms;

    @Column(name = "delivery_days")
    @Min(0)
    private Integer deliveryDays;

    @Min(1)
    @Max(5)
    private Integer rating;

    @Size(max = 2000)
    private String notes;
}
