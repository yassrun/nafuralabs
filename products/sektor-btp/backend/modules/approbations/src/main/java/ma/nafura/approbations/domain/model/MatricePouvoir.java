package ma.nafura.approbations.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
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
@Table(name = "matrice_pouvoirs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatricePouvoir {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "entity_type", nullable = false, length = 30)
    private String entityType;

    @Column(name = "seuil_min", precision = 18, scale = 4)
    private BigDecimal seuilMin;

    @Column(name = "seuil_max", precision = 18, scale = 4)
    private BigDecimal seuilMax;

    @Column(name = "approbateur_role", nullable = false, length = 100)
    private String approbateurRole;

    @Column(name = "label", nullable = false)
    private String label;

    @Column(name = "ordre", nullable = false)
    private Integer ordre;

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
        if (ordre == null) {
            ordre = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public boolean matchesMontant(BigDecimal montant) {
        if (montant == null) {
            return false;
        }
        if (seuilMin != null && montant.compareTo(seuilMin) < 0) {
            return false;
        }
        if (seuilMax != null && montant.compareTo(seuilMax) >= 0) {
            return false;
        }
        return true;
    }
}
