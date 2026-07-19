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
import ma.nafura.etudes.domain.audit.AuditableEtude;
import ma.nafura.etudes.domain.audit.EtudeAuditingListener;

@Entity
@Table(name = "prix_dpu")
@EntityListeners(EtudeAuditingListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrixDpu implements AuditableEtude {

    public static final String MODE_FOURNI = "FOURNI";
    public static final String MODE_DECOMPOSE = "DECOMPOSE";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "ouvrage_id")
    @JsonIgnore
    private UUID ouvrageId;

    @Column(name = "dpgf_noeud_id")
    private UUID dpgfNoeudId;

    /** Traçabilité si instancié depuis la bibliothèque. */
    @Column(name = "source_ouvrage_id")
    private UUID sourceOuvrageId;

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

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

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
        if (this.version == null) {
            this.version = 0L;
        }
        if (this.deboursSec == null) {
            this.deboursSec = BigDecimal.ZERO;
        }
        if (this.prixVenteHt == null) {
            this.prixVenteHt = BigDecimal.ZERO;
        }
        if (this.prixVenteTtc == null) {
            this.prixVenteTtc = BigDecimal.ZERO;
        }
        // FG / marge / TVA : renseignés par ParametresEtudeService avant persist — pas de défauts ici
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
