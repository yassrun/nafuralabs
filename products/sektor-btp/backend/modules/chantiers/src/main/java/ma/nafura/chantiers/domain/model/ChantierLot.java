package ma.nafura.chantiers.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "chantier_lots")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChantierLot {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "chantier_id", nullable = false, length = 100)
    private String chantierId;

    @Column(nullable = false, length = 50)
    private String code;

    @Column(nullable = false, length = 500)
    private String designation;

    @Column(name = "parent_lot_id", length = 100)
    private String parentLotId;

    @Column(length = 30)
    private String unite;

    @Column(precision = 18, scale = 4)
    private BigDecimal quantite;

    @Column(name = "prix_unitaire_ht", precision = 18, scale = 4)
    private BigDecimal prixUnitaireHt;

    @Column(name = "montant_ht", precision = 18, scale = 4)
    private BigDecimal montantHt;

    @Column(name = "avancement_percent", nullable = false, precision = 8, scale = 4)
    private BigDecimal avancementPercent;

    @Column(nullable = false)
    private int ordre;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (avancementPercent == null) {
            avancementPercent = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
