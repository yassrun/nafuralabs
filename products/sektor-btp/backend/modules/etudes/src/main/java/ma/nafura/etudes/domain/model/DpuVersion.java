package ma.nafura.etudes.domain.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "dpu_versions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DpuVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "prix_dpu_id", nullable = false)
    private UUID prixDpuId;

    @Column(name = "saved_at", nullable = false)
    private OffsetDateTime savedAt;

    @Column(name = "frais_generaux_percent", nullable = false, precision = 8, scale = 4)
    private BigDecimal fraisGenerauxPercent;

    @Column(name = "marge_percent", nullable = false, precision = 8, scale = 4)
    private BigDecimal margePercent;

    @Column(name = "prix_vente_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal prixVenteHt;

    @Column(name = "snapshot_json", nullable = false, columnDefinition = "jsonb")
    private String snapshotJson;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        if (this.savedAt == null) {
            this.savedAt = OffsetDateTime.now();
        }
    }
}
