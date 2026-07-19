package ma.nafura.consultation.domain.model;

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

/**
 * A node of the consultation tree. Mirrors the DPGF hierarchy:
 * LOT -> SOUS_LOT -> POSTE. Only POSTE nodes carry a {@code mode}
 * (FOURNI / DECOMPOSE), a descriptif and a catalog link.
 */
@Entity
@Table(name = "consultation_noeuds")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsultationNoeud {

    public static final String TYPE_LOT = "LOT";
    public static final String TYPE_SOUS_LOT = "SOUS_LOT";
    public static final String TYPE_POSTE = "POSTE";

    /** Approvisionnement mode for a POSTE. Default is FOURNI (ready-to-use). */
    public static final String MODE_FOURNI = "FOURNI";
    public static final String MODE_DECOMPOSE = "DECOMPOSE";

    /** Catalog link state, shared with {@link ConsultationComposant}. */
    public static final String ITEM_STATUS_LINKED = "LINKED";
    public static final String ITEM_STATUS_TO_CREATE = "TO_CREATE";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "consultation_id", nullable = false)
    private UUID consultationId;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(name = "type", nullable = false, length = 20)
    private String type;

    @Column(name = "code", length = 50)
    private String code;

    @Column(name = "libelle", nullable = false, length = 500)
    private String libelle;

    @Column(name = "unite", length = 30)
    private String unite;

    @Column(name = "quantite", precision = 18, scale = 4)
    private BigDecimal quantite;

    @Column(name = "descriptif", columnDefinition = "text")
    private String descriptif;

    @Column(name = "ordre", nullable = false)
    private Integer ordre;

    /** POSTE only. */
    @Column(name = "mode", length = 20)
    private String mode;

    /** POSTE pricing (déboursé sec = sum of composants). */
    @Column(name = "debours_sec", precision = 18, scale = 2)
    private BigDecimal deboursSec;

    @Column(name = "frais_generaux_percent", precision = 8, scale = 4)
    private BigDecimal fraisGenerauxPercent;

    @Column(name = "marge_percent", precision = 8, scale = 4)
    private BigDecimal margePercent;

    @Column(name = "prix_vente_ht", precision = 18, scale = 2)
    private BigDecimal prixVenteHt;

    /** FOURNI mode: catalog link lives on the poste itself. */
    @Column(name = "item_id", length = 100)
    private String itemId;

    @Column(name = "item_code", length = 50)
    private String itemCode;

    @Column(name = "item_name", length = 255)
    private String itemName;

    @Column(name = "item_status", length = 20)
    private String itemStatus;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    /** Child nodes, assembled by the service layer. */
    @Transient
    @JsonProperty("enfants")
    @Builder.Default
    private List<ConsultationNoeud> enfants = new ArrayList<>();

    /** DECOMPOSE mode: composants to consult, assembled by the service layer. */
    @Transient
    @JsonProperty("composants")
    @Builder.Default
    private List<ConsultationComposant> composants = new ArrayList<>();

    @JsonProperty("consultationId")
    public String getConsultationIdJson() {
        return consultationId != null ? consultationId.toString() : null;
    }

    @JsonProperty("parentId")
    public String getParentIdJson() {
        return parentId != null ? parentId.toString() : null;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.ordre == null) {
            this.ordre = 0;
        }
        if (TYPE_POSTE.equals(this.type) && this.mode == null) {
            this.mode = MODE_FOURNI;
        }
        if (TYPE_POSTE.equals(this.type)) {
            if (this.fraisGenerauxPercent == null) {
                this.fraisGenerauxPercent = new BigDecimal("8");
            }
            if (this.margePercent == null) {
                this.margePercent = BigDecimal.ZERO;
            }
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
