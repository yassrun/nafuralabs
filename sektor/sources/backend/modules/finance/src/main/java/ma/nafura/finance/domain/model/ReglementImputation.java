package ma.nafura.finance.domain.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "reglement_imputations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReglementImputation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "reglement_id", nullable = false)
    private UUID reglementId;

    @Column(name = "facture_id", nullable = false, length = 100)
    private String factureId;

    @Column(name = "facture_numero", length = 100)
    private String factureNumero;

    @Column(name = "facture_date")
    private LocalDate factureDate;

    @Column(name = "facture_due_date")
    private LocalDate factureDueDate;

    @Column(name = "facture_remaining", precision = 18, scale = 4)
    private BigDecimal factureRemaining;

    @Column(name = "allocated_amount", nullable = false, precision = 18, scale = 4)
    private BigDecimal allocatedAmount;

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
