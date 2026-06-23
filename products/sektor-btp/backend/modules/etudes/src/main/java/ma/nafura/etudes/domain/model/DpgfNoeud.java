package ma.nafura.etudes.domain.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
@Table(name = "dpgf_noeuds")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DpgfNoeud {

    public static final String TYPE_LOT = "LOT";
    public static final String TYPE_SOUS_LOT = "SOUS_LOT";
    public static final String TYPE_ARTICLE = "ARTICLE";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dpgf_id", nullable = false)
    @JsonIgnore
    private Dpgf dpgf;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(name = "type", nullable = false, length = 20)
    private String type;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "libelle", nullable = false, length = 500)
    private String libelle;

    @Column(name = "article_id")
    private UUID articleId;

    @Column(name = "metre_ligne_id")
    private UUID metreLigneId;

    @Column(name = "quantite", precision = 18, scale = 4)
    private BigDecimal quantite;

    @Column(name = "unite", length = 30)
    private String unite;

    @Column(name = "prix_unitaire", precision = 18, scale = 4)
    private BigDecimal prixUnitaire;

    @Column(name = "total", precision = 18, scale = 4)
    private BigDecimal total;

    @Column(name = "ordre", nullable = false)
    private Integer ordre;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Transient
    @JsonProperty("enfants")
    @Builder.Default
    private List<DpgfNoeud> enfants = new ArrayList<>();

    @JsonProperty("articleId")
    public String getArticleIdJson() {
        return articleId != null ? articleId.toString() : null;
    }

    @JsonProperty("metreLigneId")
    public String getMetreLigneIdJson() {
        return metreLigneId != null ? metreLigneId.toString() : null;
    }

    @JsonProperty("prixUnitaire")
    public BigDecimal getPrixUnitaireJson() {
        return prixUnitaire;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.ordre == null) {
            this.ordre = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
