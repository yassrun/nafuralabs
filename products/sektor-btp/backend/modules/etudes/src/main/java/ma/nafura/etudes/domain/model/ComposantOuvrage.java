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
@Table(name = "composants_ouvrage")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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

    @Column(name = "article_id", length = 100)
    private String articleId;

    @Column(name = "designation", nullable = false, length = 500)
    private String designation;

    @Column(name = "unite", nullable = false, length = 30)
    private String unite;

    @Column(name = "rendement", nullable = false, precision = 18, scale = 4)
    private BigDecimal rendement;

    @Column(name = "prix_unitaire", nullable = false, precision = 18, scale = 4)
    private BigDecimal prixUnitaire;

    @Column(name = "total", nullable = false, precision = 18, scale = 4)
    private BigDecimal total;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @JsonProperty("ouvrageId")
    public String getOuvrageId() {
        if (ouvrage != null && ouvrage.getId() != null) {
            return ouvrage.getId().toString();
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
