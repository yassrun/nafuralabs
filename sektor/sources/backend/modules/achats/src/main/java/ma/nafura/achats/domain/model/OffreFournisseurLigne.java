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
import lombok.NoArgsConstructor;

@Entity
@Table(name = "offres_fournisseur_lignes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OffreFournisseurLigne {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "offre_fournisseur_id", nullable = false)
    @JsonBackReference("offre-lignes")
    private OffreFournisseur offre;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appel_offre_ligne_id", nullable = false)
    private AppelOffreLigne appelOffreLigne;

    @Column(name = "prix_unitaire_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal prixUnitaireHt;

    @Column(name = "total_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalHt;

    @Column(name = "delai_specifique")
    private Integer delaiSpecifique;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @JsonProperty("reponseId")
    public String getReponseId() {
        if (offre != null && offre.getId() != null) {
            return offre.getId().toString();
        }
        return null;
    }

    @JsonProperty("aoLigneId")
    public String getAoLigneId() {
        if (appelOffreLigne != null && appelOffreLigne.getId() != null) {
            return appelOffreLigne.getId().toString();
        }
        return null;
    }

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
