package ma.nafura.catalogue.domain.model;

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
@Table(name = "item_match")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemMatch {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "source_type", nullable = false, length = 40)
    private String sourceType;

    @Column(name = "source_id", nullable = false)
    private UUID sourceId;

    @Column(name = "catalog_cle", nullable = false, length = 120)
    private String catalogCle;

    @Column(nullable = false, length = 20)
    private String methode;

    @Column(nullable = false, precision = 5, scale = 4)
    private BigDecimal confiance;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String statut = "SUGGERE";

    @Column(name = "valide_par", length = 120)
    private String validePar;

    @Column(name = "valide_le")
    private OffsetDateTime valideLe;

    @Column(name = "model_version", length = 80)
    private String modelVersion;

    @Column(name = "libelle_source", length = 300)
    private String libelleSource;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        OffsetDateTime now = OffsetDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (statut == null) {
            statut = "SUGGERE";
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
