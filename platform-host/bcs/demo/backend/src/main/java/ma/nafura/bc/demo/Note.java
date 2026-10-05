package ma.nafura.bc.demo;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ma.nafura.platform.framework.domain.TenantEntity;

@Entity(name = "DemoNote")
@Table(name = "demo_note")
@Getter
@Setter
@NoArgsConstructor
public class Note extends TenantEntity {

    @NotBlank
    @Size(max = 200)
    @Column(nullable = false, length = 200)
    private String title;

    public Note(UUID tenantId, String title) {
        setTenantId(tenantId);
        this.title = title;
    }
}
