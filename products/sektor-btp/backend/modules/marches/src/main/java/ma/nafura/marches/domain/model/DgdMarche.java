package ma.nafura.marches.domain.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "dgd_marche")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DgdMarche {

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_SOUMIS_MOA = "SOUMIS_MOA";
    public static final String STATUS_NOTIFIE = "NOTIFIE";
    public static final String STATUS_PAYE = "PAYE";

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

    @Column(name = "cumul_situations_ttc", nullable = false, precision = 18, scale = 4)
    private BigDecimal cumulSituationsTtc;

    @Column(name = "cumul_retenue_garantie", nullable = false, precision = 18, scale = 4)
    private BigDecimal cumulRetenueGarantie;

    @Column(name = "cumul_revision_k", nullable = false, precision = 18, scale = 4)
    private BigDecimal cumulRevisionK;

    @Column(name = "cumul_penalites", nullable = false, precision = 18, scale = 4)
    private BigDecimal cumulPenalites;

    @Column(name = "reprises_rg", nullable = false, precision = 18, scale = 4)
    private BigDecimal reprisesRg;

    @Column(name = "montant_net_a_payer", nullable = false, precision = 18, scale = 4)
    private BigDecimal montantNetAPayer;

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
        applyDefaults();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    private void applyDefaults() {
        if (this.cumulSituationsTtc == null) {
            this.cumulSituationsTtc = BigDecimal.ZERO;
        }
        if (this.cumulRetenueGarantie == null) {
            this.cumulRetenueGarantie = BigDecimal.ZERO;
        }
        if (this.cumulRevisionK == null) {
            this.cumulRevisionK = BigDecimal.ZERO;
        }
        if (this.cumulPenalites == null) {
            this.cumulPenalites = BigDecimal.ZERO;
        }
        if (this.reprisesRg == null) {
            this.reprisesRg = BigDecimal.ZERO;
        }
        if (this.montantNetAPayer == null) {
            this.montantNetAPayer = BigDecimal.ZERO;
        }
    }
}
