package ma.nafura.stock.domain.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "inventory_tx_sequences")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryTxSequence {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "tx_type", nullable = false, length = 50)
    private String txType;

    @Column(name = "exercice", nullable = false)
    private Integer exercice;

    @Column(name = "last_value", nullable = false)
    private Long lastValue;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void touch() {
        this.updatedAt = OffsetDateTime.now();
    }
}
