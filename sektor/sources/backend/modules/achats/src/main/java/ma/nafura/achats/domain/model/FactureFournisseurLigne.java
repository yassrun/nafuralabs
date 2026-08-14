package ma.nafura.achats.domain.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "factures_fournisseur_lignes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FactureFournisseurLigne {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facture_fournisseur_id", nullable = false)
    @JsonBackReference
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private FactureFournisseur facture;

    @Column(name = "ordre", nullable = false)
    private Integer ordre;

    @Column(name = "designation", nullable = false, length = 500)
    private String designation;

    @Column(name = "bc_ligne_id")
    private UUID bcLigneId;

    @Column(name = "compte_code", nullable = false, length = 20)
    private String compteCode;

    @Column(name = "axe_analytique", length = 100)
    private String axeAnalytique;

    @Column(name = "axe_analytique_libelle", length = 255)
    private String axeAnalytiqueLibelle;

    @Column(name = "quantite", precision = 18, scale = 4)
    private BigDecimal quantite;

    @Column(name = "prix_unitaire_ht", precision = 18, scale = 4)
    private BigDecimal prixUnitaireHt;

    @Column(name = "total_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalHt;

    @Column(name = "tva_taux", nullable = false, precision = 8, scale = 4)
    private BigDecimal tvaTaux;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @JsonProperty("factureId")
    public String getFactureId() {
        if (facture != null && facture.getId() != null) {
            return facture.getId().toString();
        }
        return null;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.tvaTaux == null) {
            this.tvaTaux = new BigDecimal("20");
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
