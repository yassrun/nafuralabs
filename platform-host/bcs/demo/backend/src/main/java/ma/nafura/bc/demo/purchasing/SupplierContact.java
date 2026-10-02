package ma.nafura.bc.demo.purchasing;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import ma.nafura.platform.framework.domain.TenantEntity;

@Entity(name = "DemoSupplierContact")
@Table(name = "demo_supplier_contact")
@Getter
@Setter
public class SupplierContact extends TenantEntity {

    @NotNull
    @Column(name = "supplier_id")
    private UUID supplierId;

    @NotBlank
    @Size(max = 120)
    private String name;

    @Column(name = "job_title")
    @Size(max = 120)
    private String jobTitle;

    @Email
    @Size(max = 160)
    private String email;

    @Size(max = 40)
    private String phone;

    @Column(name = "main_contact")
    private boolean mainContact;
}
