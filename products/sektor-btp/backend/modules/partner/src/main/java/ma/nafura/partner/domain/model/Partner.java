package ma.nafura.partner.domain.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "partners")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Partner {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "code", nullable = false, length = 30)
    private String code;

    @Column(name = "raison_sociale", nullable = false, length = 255)
    private String raisonSociale;

    @Column(name = "forme_juridique", length = 50)
    private String formeJuridique;

    @Column(name = "ice", length = 15)
    private String ice;

    @Column(name = "identifiant_fiscal", length = 8)
    private String identifiantFiscal;

    @Column(name = "registre_commerce", length = 50)
    private String registreCommerce;

    @Column(name = "patente", length = 50)
    private String patente;

    @Column(name = "cnss", length = 20)
    private String cnss;

    @Column(name = "amo", length = 20)
    private String amo;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "phone", length = 50)
    private String phone;

    @Column(name = "website", length = 255)
    private String website;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    /** Lookup label fallback for CrudController /lookup (candidates: name, label, title, code). */
    public String getName() {
        return raisonSociale;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
