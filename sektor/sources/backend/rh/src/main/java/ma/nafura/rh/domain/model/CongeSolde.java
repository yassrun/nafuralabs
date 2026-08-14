package ma.nafura.rh.domain.model;

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
@Table(name = "conge_soldes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CongeSolde {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "employe_id", nullable = false, length = 100)
    private String employeId;

    @Column(name = "solde_jours", nullable = false, precision = 8, scale = 2)
    private BigDecimal soldeJours;

    @Column(name = "credite_annuel", nullable = false, precision = 8, scale = 2)
    private BigDecimal crediteAnnuel;

    @Column(name = "pris_annuel", nullable = false, precision = 8, scale = 2)
    private BigDecimal prisAnnuel;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        updatedAt = OffsetDateTime.now();
        if (soldeJours == null) {
            soldeJours = BigDecimal.ZERO;
        }
        if (crediteAnnuel == null) {
            crediteAnnuel = BigDecimal.ZERO;
        }
        if (prisAnnuel == null) {
            prisAnnuel = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
