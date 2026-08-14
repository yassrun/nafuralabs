package ma.nafura.etudes.domain.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
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
@Table(name = "devis_lignes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DevisLigne {

    public static final String TYPE_CHAPITRE = "CHAPITRE";
    public static final String TYPE_OUVRAGE = "OUVRAGE";
    public static final String TYPE_TEXTE = "TEXTE";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "devis_id", nullable = false)
    @JsonBackReference
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private Devis devis;

    @Column(name = "ordre", nullable = false)
    private Integer ordre;

    @Column(name = "parent_ligne_id")
    @JsonIgnore
    private UUID parentLigneId;

    @Column(name = "type", nullable = false, length = 20)
    private String type;

    @Column(name = "code", length = 50)
    private String code;

    @Column(name = "designation", nullable = false, length = 500)
    private String designation;

    @Column(name = "ouvrage_id")
    @JsonIgnore
    private UUID ouvrageId;

    @Column(name = "unite", length = 30)
    private String unite;

    @Column(name = "quantite", precision = 18, scale = 4)
    private BigDecimal quantite;

    @Column(name = "prix_unitaire_ht", precision = 18, scale = 4)
    private BigDecimal prixUnitaireHt;

    @Column(name = "total_ht", precision = 18, scale = 4)
    private BigDecimal totalHt;

    @Column(name = "remise_percent", precision = 8, scale = 4)
    private BigDecimal remisePercent;

    @Column(name = "notes")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @JsonProperty("devisId")
    public String getDevisIdJson() {
        return devis != null && devis.getId() != null ? devis.getId().toString() : null;
    }

    @JsonProperty("parentLigneId")
    public String getParentLigneIdJson() {
        return parentLigneId != null ? parentLigneId.toString() : null;
    }

    @JsonProperty("ouvrageId")
    public String getOuvrageIdJson() {
        return ouvrageId != null ? ouvrageId.toString() : null;
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
