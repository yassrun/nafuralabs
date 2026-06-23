package ma.nafura.ventes.domain.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "factures_client_lignes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FactureClientLigne {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facture_id", nullable = false)
    @JsonBackReference("lignes")
    private FactureClient facture;

    @Column(name = "ordre", nullable = false)
    private Integer ordre;

    @Column(name = "designation", nullable = false, length = 500)
    private String designation;

    @Column(name = "unite", length = 30)
    private String unite;

    @Column(name = "quantite", precision = 18, scale = 4)
    private BigDecimal quantite;

    @Column(name = "prix_unitaire_ht", precision = 18, scale = 4)
    private BigDecimal prixUnitaireHt;

    @Column(name = "total_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalHt;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.totalHt == null) {
            this.totalHt = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
