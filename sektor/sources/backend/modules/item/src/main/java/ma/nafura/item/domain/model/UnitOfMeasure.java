package ma.nafura.item.domain.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "unit_of_measure")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UnitOfMeasure {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "code", nullable = false, length = 30)
    private String code;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "uom_category_id")
    private UUID uomCategoryId;

    @Column(name = "description")
    private String description;

    /**
     * Combien d'unités de base dans 1 unité de cette mesure.
     * Ex. : 1 M3 = 1000 L → facteurVersBase = 1000 si L est la base.
     */
    @Column(name = "facteur_vers_base", nullable = false, precision = 18, scale = 8)
    @Builder.Default
    private BigDecimal facteurVersBase = BigDecimal.ONE;

    /** Exactement une unité de base par (tenant, catégorie). */
    @Column(name = "est_base", nullable = false)
    @Builder.Default
    private Boolean estBase = false;

    @Column(name = "isActive")
    private Boolean isActive;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.facteurVersBase == null) {
            this.facteurVersBase = BigDecimal.ONE;
        }
        if (this.estBase == null) {
            this.estBase = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
