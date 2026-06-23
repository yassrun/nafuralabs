package ma.nafura.stock.domain.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "inventory_txs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryTx {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "tx_number", nullable = false, length = 50)
    private String txNumber;

    @Column(name = "tx_type", nullable = false, length = 50)
    private String txType;

    @Column(name = "warehouse_id", nullable = false)
    private UUID warehouseId;

    @Column(name = "source_location_id")
    private UUID sourceLocationId;

    @Column(name = "dest_location_id")
    private UUID destLocationId;

    @Column(name = "fournisseur_id")
    private UUID fournisseurId;

    @Column(name = "chantier_location_id")
    private UUID chantierLocationId;

    @Column(name = "chantier_budget_id", length = 50)
    private String chantierBudgetId;

    @Column(name = "phase_ref", length = 100)
    private String phaseRef;

    @Column(name = "motif_id")
    private UUID motifId;

    @Column(name = "bc_id")
    private UUID bcId;

    @Column(name = "tx_date", nullable = false)
    private LocalDate txDate;

    @Column(name = "reference", length = 100)
    private String reference;

    @Column(name = "status", length = 50)
    private String status;

    @Column(name = "notes")
    private String notes;

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
