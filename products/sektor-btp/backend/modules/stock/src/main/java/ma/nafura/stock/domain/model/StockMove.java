package ma.nafura.stock.domain.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "stock_moves")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockMove {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "inventory_tx_id")
    private UUID inventoryTxId;

    @Column(name = "inventory_tx_line_id")
    private UUID inventoryTxLineId;

    @Column(name = "location_id", nullable = false)
    private UUID locationId;

    @Column(name = "item_id", nullable = false)
    private UUID itemId;

    /** Signed quantity: positive = in, negative = out. */
    @Column(name = "quantity", nullable = false, precision = 18, scale = 4)
    private BigDecimal quantity;

    @Column(name = "unit_cost", precision = 18, scale = 4)
    private BigDecimal unitCost;

    @Column(name = "total_cost", precision = 18, scale = 4)
    private BigDecimal totalCost;

    @Column(name = "moved_at", nullable = false)
    private OffsetDateTime movedAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "reversal_of_move_id")
    private UUID reversalOfMoveId;

    @Column(name = "is_opening", nullable = false)
    @Builder.Default
    private boolean opening = false;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.movedAt == null) {
            this.movedAt = now;
        }
    }
}
