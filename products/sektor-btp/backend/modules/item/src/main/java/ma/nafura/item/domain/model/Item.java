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
@Table(name = "items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "code", length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "item_type_id")
    private UUID itemTypeId;

    @Column(name = "item_category_id")
    private UUID itemCategoryId;

    @Column(name = "unit_of_measure_id")
    private UUID unitOfMeasureId;

    @Column(name = "sku", length = 100)
    private String sku;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "article_type", length = 30)
    private String articleType;

    @Column(name = "poste_budget_id", length = 50)
    private String posteBudgetId;

    @Column(name = "default_location_id")
    private UUID defaultLocationId;

    @Column(name = "is_perissable")
    private Boolean isPerissable;

    @Column(name = "abc_class", length = 1)
    private String abcClass;

    @Column(name = "pmp", precision = 18, scale = 4)
    private BigDecimal pmp;

    @Column(name = "prix_unitaire", precision = 18, scale = 4)
    private BigDecimal prixUnitaire;

    @Column(name = "stock_min", precision = 18, scale = 4)
    private BigDecimal stockMin;

    @Column(name = "stock_max", precision = 18, scale = 4)
    private BigDecimal stockMax;

    @Column(name = "delai_reappro_jours")
    private Integer delaiReapproJours;

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
