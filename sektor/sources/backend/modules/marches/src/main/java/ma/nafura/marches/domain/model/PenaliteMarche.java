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
@Table(name = "penalites_marche")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PenaliteMarche {

    public static final String TYPE_RETARD = "RETARD";
    public static final String TYPE_QUALITE = "QUALITE";
    public static final String TYPE_AUTRE = "AUTRE";

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_VALIDEE = "VALIDEE";
    public static final String STATUS_ANNULEE = "ANNULEE";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "numero", nullable = false, length = 50)
    private String numero;

    @Column(name = "contrat_marche_id", nullable = false, length = 100)
    private String contratMarcheId;

    @Column(name = "marche_numero", length = 50)
    private String marcheNumero;

    @Column(name = "type", nullable = false, length = 30)
    private String type;

    @Column(name = "motif", length = 500)
    private String motif;

    @Column(name = "montant_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal montantHt;

    @Column(name = "jours_retard")
    private Integer joursRetard;

    @Column(name = "date_constat")
    private LocalDate dateConstat;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

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
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
