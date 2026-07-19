package ma.nafura.etudes.domain.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.nafura.item.domain.SourcePrix;

@Entity
@Table(name = "composants_dpu")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComposantDpu {

    public static final String TYPE_MATIERE = "MATIERE";
    public static final String TYPE_MAIN_DOEUVRE = "MAIN_DOEUVRE";
    public static final String TYPE_MATERIEL = "MATERIEL";
    public static final String TYPE_SOUS_TRAITANCE = "SOUS_TRAITANCE";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prix_dpu_id", nullable = false)
    @JsonBackReference
    private PrixDpu prixDpu;

    @Column(name = "type", nullable = false, length = 30)
    private String type;

    @Column(name = "article_ou_poste_id", nullable = false, length = 100)
    @JsonProperty("articleOuPosteId")
    private String articleOuPosteId;

    /**
     * Quantité de ce composant nécessaire pour UNE unité d'ouvrage (ex. 350 kg de ciment par m³).
     * Ce n'est PAS une quantité absolue — ne jamais multiplier par la quantité du bordereau ici.
     */
    @Column(name = "rendement", nullable = false, precision = 18, scale = 4)
    @JsonProperty("rendement")
    private BigDecimal rendement;

    @Column(name = "unite", nullable = false, length = 30)
    private String unite;

    @Column(name = "prix_unitaire", nullable = false, precision = 18, scale = 4)
    @JsonProperty("prixUnitaire")
    private BigDecimal prixUnitaire;

    @Column(name = "total", nullable = false, precision = 18, scale = 4)
    private BigDecimal total;

    @Column(name = "ordre", nullable = false)
    private Integer ordre;

    @Column(name = "source_prix", nullable = false, length = 20)
    private String sourcePrix;

    @Column(name = "offre_fournisseur_id")
    private UUID offreFournisseurId;

    @Column(name = "suggere_par_ia", nullable = false)
    private Boolean suggereParIa;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    /** Alias JSON lecture (compat front) — ne pas utiliser en écriture métier. */
    @JsonProperty("quantite")
    public BigDecimal getQuantite() {
        return rendement;
    }

    @JsonSetter("quantite")
    public void setQuantite(BigDecimal quantite) {
        this.rendement = quantite;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.ordre == null) {
            this.ordre = 0;
        }
        if (this.sourcePrix == null) {
            this.sourcePrix = SourcePrix.MANUEL;
        }
        if (this.suggereParIa == null) {
            this.suggereParIa = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
