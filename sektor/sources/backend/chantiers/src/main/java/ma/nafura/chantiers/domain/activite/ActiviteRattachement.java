package ma.nafura.chantiers.domain.activite;

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

/**
 * Rattachement activité → nœud (lot feuille ou poste) avec quotité = quantité prévue (AC-6, AC-7).
 */
@Entity
@Table(name = "chantier_activite_rattachements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActiviteRattachement {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "activite_id", nullable = false, length = 100)
    private String activiteId;

    @Column(name = "lot_id", length = 100)
    private String lotId;

    @Column(name = "poste_id", length = 100)
    private String posteId;

    @Column(name = "quantite_prevue", nullable = false, precision = 18, scale = 4)
    private BigDecimal quantitePrevue;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public String noeudId() {
        return posteId != null && !posteId.isBlank() ? posteId : lotId;
    }

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
