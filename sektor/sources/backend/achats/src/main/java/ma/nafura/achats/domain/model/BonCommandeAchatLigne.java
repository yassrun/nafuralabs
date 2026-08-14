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
@Table(name = "bons_commande_achat_lignes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BonCommandeAchatLigne {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bon_commande_achat_id", nullable = false)
    @JsonBackReference
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private BonCommandeAchat bonCommande;

    @Column(name = "article_id", nullable = false, length = 100)
    private String articleId;

    @Column(name = "article_code", length = 50)
    private String articleCode;

    @Column(name = "article_name", length = 255)
    private String articleName;

    @Column(name = "quantite", nullable = false, precision = 18, scale = 4)
    private BigDecimal quantite;

    @Column(name = "quantite_livree", nullable = false, precision = 18, scale = 4)
    private BigDecimal quantiteLivree;

    @Column(name = "quantite_facturee", nullable = false, precision = 18, scale = 4)
    private BigDecimal quantiteFacturee;

    @Column(name = "uom_code", length = 30)
    private String uomCode;

    @Column(name = "prix_unitaire_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal prixUnitaireHt;

    @Column(name = "total_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalHt;

    @Column(name = "notes")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @JsonProperty("bcId")
    public String getBcId() {
        if (bonCommande != null && bonCommande.getId() != null) {
            return bonCommande.getId().toString();
        }
        return null;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.quantiteLivree == null) {
            this.quantiteLivree = BigDecimal.ZERO;
        }
        if (this.quantiteFacturee == null) {
            this.quantiteFacturee = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
