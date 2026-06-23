package ma.nafura.achats.domain.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "catalogue_fournisseur_lignes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CatalogueFournisseurLigne {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "fournisseur_id", nullable = false, length = 100)
    private String fournisseurId;

    @Column(name = "article_id", nullable = false, length = 100)
    private String articleId;

    @Column(name = "ref_fournisseur", length = 100)
    private String refFournisseur;

    @Column(name = "designation", nullable = false)
    private String designation;

    @Column(name = "prix_unitaire_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal prixUnitaireHt;

    @Column(name = "uom", length = 30)
    private String uom;

    @Column(name = "actif", nullable = false)
    private Boolean actif;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.actif == null) {
            this.actif = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
