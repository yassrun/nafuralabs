package ma.nafura.ventes.domain.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonProperty;
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
@Table(name = "encaissements_client")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EncaissementClient {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facture_id", nullable = false)
    @JsonBackReference("encaissements")
    private FactureClient facture;

    @JsonProperty("factureId")
    public UUID getFactureId() {
        return facture != null ? facture.getId() : null;
    }

    @Column(name = "date_encaissement", nullable = false)
    private LocalDate dateEncaissement;

    @Column(name = "mode_paiement", nullable = false, length = 30)
    private String modePaiement;

    @Column(name = "montant_ttc", nullable = false, precision = 18, scale = 4)
    private BigDecimal montantTtc;

    @Column(name = "reference", length = 100)
    private String reference;

    @Column(name = "banque_id", length = 100)
    private String banqueId;

    @Column(name = "banque", length = 255)
    private String banque;

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
        if (this.montantTtc == null) {
            this.montantTtc = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
