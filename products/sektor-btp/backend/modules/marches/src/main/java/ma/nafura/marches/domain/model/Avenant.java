package ma.nafura.marches.domain.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "avenants")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Avenant {

    public static final String TYPE_TVX_SUPPLEMENTAIRES = "TVX_SUPPLEMENTAIRES";
    public static final String TYPE_PROLONGATION_DELAI = "PROLONGATION_DELAI";
    public static final String TYPE_ADAPTATION_TECHNIQUE = "ADAPTATION_TECHNIQUE";
    public static final String TYPE_MONTANT = "MONTANT";
    public static final String TYPE_DELAI = "DELAI";
    public static final String TYPE_MIXTE = "MIXTE";

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_EN_SIGNATURE = "EN_SIGNATURE";
    public static final String STATUS_SIGNE = "SIGNE";
    public static final String STATUS_APPLIQUE = "APPLIQUE";
    public static final String STATUS_ANNULE = "ANNULE";
    public static final String STATUS_PROPOSE = "PROPOSE";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "numero", nullable = false, length = 50)
    private String numero;

    @Column(name = "contrat_marche_id", nullable = false, length = 100)
    private String contratMarcheId;

    @Column(name = "marche_numero", nullable = false, length = 50)
    private String marcheNumero;

    @Column(name = "type", nullable = false, length = 40)
    private String type;

    @Column(name = "objet", nullable = false, length = 500)
    private String objet;

    @Column(name = "motif", columnDefinition = "TEXT")
    private String motif;

    @Column(name = "montant_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal montantHt;

    @Column(name = "prolongation_jours", nullable = false)
    private Integer prolongationJours;

    @Column(name = "date_signature")
    private LocalDate dateSignature;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "impact_propage_le")
    private OffsetDateTime impactPropageLe;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.status == null) {
            this.status = STATUS_BROUILLON;
        }
        if (this.montantHt == null) {
            this.montantHt = BigDecimal.ZERO;
        }
        if (this.prolongationJours == null) {
            this.prolongationJours = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
