package ma.nafura.etudes.domain.model;

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

    @Column(name = "quantite", nullable = false, precision = 18, scale = 4)
    private BigDecimal quantite;

    @Column(name = "unite", nullable = false, length = 30)
    private String unite;

    @Column(name = "prix_unitaire", nullable = false, precision = 18, scale = 4)
    @JsonProperty("prixUnitaire")
    private BigDecimal prixUnitaire;

    @Column(name = "total", nullable = false, precision = 18, scale = 4)
    private BigDecimal total;

    @Column(name = "ordre", nullable = false)
    private Integer ordre;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

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
