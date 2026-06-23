package ma.nafura.etudes.domain.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "prix_dpu")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrixDpu {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "ouvrage_id", nullable = false)
    @JsonIgnore
    private UUID ouvrageId;

    @Column(name = "debours_sec", nullable = false, precision = 18, scale = 4)
    @JsonProperty("deboursSec")
    private BigDecimal deboursSec;

    @Column(name = "frais_generaux_percent", nullable = false, precision = 8, scale = 4)
    @JsonProperty("fraisGenerauxPercent")
    private BigDecimal fraisGenerauxPercent;

    @Column(name = "marge_beneficiaire_percent", nullable = false, precision = 8, scale = 4)
    @JsonProperty("margeBeneficiairePercent")
    private BigDecimal margeBeneficiairePercent;

    @Column(name = "prix_vente_ht", nullable = false, precision = 18, scale = 4)
    @JsonProperty("prixVenteHT")
    private BigDecimal prixVenteHt;

    @Column(name = "prix_vente_ttc", nullable = false, precision = 18, scale = 4)
    @JsonProperty("prixVenteTTC")
    private BigDecimal prixVenteTtc;

    @Column(name = "tva_taux", nullable = false, precision = 8, scale = 4)
    @JsonProperty("tvaTaux")
    private BigDecimal tvaTaux;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "prixDpu", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    @OrderBy("ordre ASC")
    @Builder.Default
    private List<ComposantDpu> composants = new ArrayList<>();

    @JsonProperty("articleId")
    public String getArticleIdJson() {
        return ouvrageId != null ? ouvrageId.toString() : null;
    }

    @JsonProperty("unite")
    @Transient
    private String unite;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.deboursSec == null) {
            this.deboursSec = BigDecimal.ZERO;
        }
        if (this.fraisGenerauxPercent == null) {
            this.fraisGenerauxPercent = new BigDecimal("8");
        }
        if (this.margeBeneficiairePercent == null) {
            this.margeBeneficiairePercent = new BigDecimal("7");
        }
        if (this.prixVenteHt == null) {
            this.prixVenteHt = BigDecimal.ZERO;
        }
        if (this.prixVenteTtc == null) {
            this.prixVenteTtc = BigDecimal.ZERO;
        }
        if (this.tvaTaux == null) {
            this.tvaTaux = new BigDecimal("20");
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
