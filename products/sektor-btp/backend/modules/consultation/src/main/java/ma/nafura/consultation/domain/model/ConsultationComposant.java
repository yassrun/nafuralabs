package ma.nafura.consultation.domain.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * A material or service to consult, resulting from the decomposition of a
 * POSTE ({@link ConsultationNoeud} in DECOMPOSE mode). Each composant is
 * resolved against the {@code items} catalog (linked or to create).
 */
@Entity
@Table(name = "consultation_composants")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsultationComposant {

    public static final String TYPE_MATERIAU = "MATERIAU";
    public static final String TYPE_SERVICE = "SERVICE";
    public static final String TYPE_LOCATION = "LOCATION";
    public static final String TYPE_MO = "MO";
    public static final String TYPE_SOUS_TRAITANCE = "SOUS_TRAITANCE";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "noeud_id", nullable = false)
    private UUID noeudId;

    @Column(name = "type", nullable = false, length = 30)
    private String type;

    @Column(name = "designation", nullable = false, length = 500)
    private String designation;

    @Column(name = "unite", length = 30)
    private String unite;

    /**
     * Quantité de ce composant par unité d'ouvrage (rendement).
     */
    @Column(name = "rendement", precision = 18, scale = 4)
    private BigDecimal rendement;

    @Column(name = "quantite", precision = 18, scale = 4)
    private BigDecimal quantite;

    @Column(name = "prix_unitaire", precision = 18, scale = 4)
    private BigDecimal prixUnitaire;

    @Column(name = "total", precision = 18, scale = 2)
    private BigDecimal total;

    @Column(name = "item_id", length = 100)
    private String itemId;

    @Column(name = "item_code", length = 50)
    private String itemCode;

    @Column(name = "item_name", length = 255)
    private String itemName;

    @Column(name = "item_status", length = 20)
    private String itemStatus;

    @Column(name = "ordre", nullable = false)
    private Integer ordre;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "source", columnDefinition = "jsonb")
    private Map<String, Object> source;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @JsonProperty("noeudId")
    public String getNoeudIdJson() {
        return noeudId != null ? noeudId.toString() : null;
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
