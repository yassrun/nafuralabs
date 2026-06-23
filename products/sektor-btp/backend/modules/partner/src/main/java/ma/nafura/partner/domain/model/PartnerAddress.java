package ma.nafura.partner.domain.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "partner_addresses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartnerAddress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "partner_id", nullable = false)
    private UUID partnerId;

    @Column(name = "type", nullable = false, length = 30)
    private String type;

    @Column(name = "ligne1", length = 255)
    private String ligne1;

    @Column(name = "ligne2", length = 255)
    private String ligne2;

    @Column(name = "ville", length = 100)
    private String ville;

    @Column(name = "code_postal", length = 20)
    private String codePostal;

    @Column(name = "pays", length = 2)
    private String pays;

    @Column(name = "is_default")
    private Boolean isDefault;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

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
