package ma.nafura.etudes.domain.ouvrage;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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

@Entity
@Table(name = "composants_ouvrage")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class ComposantOuvrage {

    public static final String TYPE_MATERIAU = "MATERIAU";
    public static final String TYPE_SOUS_TRAITANCE = "SOUS_TRAITANCE";
    public static final String TYPE_LOCATION = "LOCATION";
    public static final String TYPE_OUTILLAGE = "OUTILLAGE";
    public static final String TYPE_MO = "MO";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ouvrage_id", nullable = false)
    @JsonBackReference
    private Ouvrage ouvrage;

    @Column(name = "type", nullable = false, length = 30)
    private String type;

    /** ITEM | OUVRAGE | LIBRE */
    @Column(name = "reference_type", nullable = false, length = 20)
    private String referenceType;

    @Column(name = "item_id")
    private UUID itemId;

    /**
     * Référence typée vers un autre ouvrage (composite). Distinct du parent {@link #ouvrage}
     * ({@code ouvrage_id} en base).
     */
    @Column(name = "ref_ouvrage_id")
    private UUID refOuvrageId;

    @Column(name = "libelle", nullable = false, length = 500)
    private String libelle;

    @Column(name = "unite", nullable = false, length = 30)
    private String unite;

    @Column(name = "rendement", nullable = false, precision = 18, scale = 4)
    private BigDecimal rendement;

    @Column(name = "prix_unitaire", nullable = false, precision = 18, scale = 4)
    private BigDecimal prixUnitaire;

    @Column(name = "total", nullable = false, precision = 18, scale = 4)
    private BigDecimal total;

    /**
     * L10 — sous-traitance : remonter le prix de vente du sous-ouvrage (FG+marge inclus).
     * Défaut false = déboursé uniquement (anti marge-sur-marge).
     */
    @Column(name = "inclure_frais_et_marge", nullable = false)
    @Builder.Default
    private Boolean inclureFraisEtMarge = false;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    /** Id du parent ouvrage (FK). */
    @JsonProperty("ouvrageId")
    public String getOuvrageId() {
        if (ouvrage != null && ouvrage.getId() != null) {
            return ouvrage.getId().toString();
        }
        return null;
    }

    /** Compat seed / API legacy. */
    @JsonProperty("designation")
    public String getDesignation() {
        return libelle;
    }

    @JsonSetter("designation")
    public void setDesignation(String designation) {
        if (designation != null && !designation.isBlank()) {
            this.libelle = designation.trim();
        }
    }

    @JsonSetter("articleId")
    public void setArticleIdLegacy(String articleId) {
        if (this.libelle == null && articleId != null && !articleId.isBlank()) {
            this.libelle = articleId.trim();
        }
        if (this.referenceType == null) {
            this.referenceType = "LIBRE";
        }
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.referenceType == null) {
            this.referenceType = "LIBRE";
        }
        if (this.inclureFraisEtMarge == null) {
            this.inclureFraisEtMarge = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
