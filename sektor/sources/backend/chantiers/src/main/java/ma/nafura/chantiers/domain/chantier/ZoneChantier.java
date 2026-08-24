package ma.nafura.chantiers.domain.chantier;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AC-14 du contrat {@code avancement-et-attachement} — le référentiel de zones du chantier.
 *
 * <p>Arborescent (bâtiment › niveau › zone via {@code parentZoneId}), tenu au **chantier**, et
 * **vide par défaut** : un chantier sans zone déclarée produit ses attachements normalement, sans
 * zone. Ce sous-lot est le premier consommateur — le seul référentiel de zones du produit, aucun
 * autre module n'en crée un second.
 */
@Entity
@Table(name = "zones_chantier")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ZoneChantier {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "chantier_id", nullable = false, length = 100)
    private String chantierId;

    @Column(nullable = false, length = 500)
    private String designation;

    @Column(name = "parent_zone_id", length = 100)
    private String parentZoneId;

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
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
