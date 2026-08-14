package ma.nafura.marches.domain.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "bpu_lignes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BpuLigne {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "contrat_marche_id", nullable = false, length = 100)
    private String contratMarcheId;

    @Column(name = "poste_code", nullable = false, length = 50)
    private String posteCode;

    @Column(name = "designation", nullable = false, length = 500)
    private String designation;

    @Column(name = "unite", nullable = false, length = 30)
    private String unite;

    @Column(name = "quantite", nullable = false, precision = 18, scale = 4)
    private BigDecimal quantite;

    @Column(name = "prix_unitaire_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal prixUnitaireHt;

    @Column(name = "montant_ht", precision = 18, scale = 4)
    private BigDecimal montantHt;

    @Column(name = "ordre", nullable = false)
    private Integer ordre;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @JsonProperty("contratId")
    public String getContratId() {
        return contratMarcheId;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.quantite == null) {
            this.quantite = BigDecimal.ZERO;
        }
        if (this.prixUnitaireHt == null) {
            this.prixUnitaireHt = BigDecimal.ZERO;
        }
        if (this.ordre == null) {
            this.ordre = 0;
        }
        recomputeMontant();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
        recomputeMontant();
    }

    public void recomputeMontant() {
        if (quantite != null && prixUnitaireHt != null) {
            this.montantHt = quantite.multiply(prixUnitaireHt);
        }
    }
}
