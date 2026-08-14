package ma.nafura.chantiers.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.util.StringUtils;

@Entity
@Table(name = "situations_travaux")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SituationTravaux {

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_SOUMISE = "SOUMISE";
    public static final String STATUS_VALIDEE_MOA = "VALIDEE_MOA";
    public static final String STATUS_FACTUREE = "FACTUREE";
    public static final String STATUS_PAYEE = "PAYEE";
    public static final String STATUS_REJETEE = "REJETEE";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "chantier_id", nullable = false, length = 100)
    private String chantierId;

    @Column(nullable = false, length = 50)
    private String numero;

    @Column(name = "numero_ordre", nullable = false)
    private int numeroOrdre;

    @Column(name = "date_periode_debut", nullable = false)
    private LocalDate datePeriodeDebut;

    @Column(name = "date_periode_fin", nullable = false)
    private LocalDate datePeriodeFin;

    @Column(name = "date_emission", nullable = false)
    private LocalDate dateEmission;

    @Column(name = "cumul_precedent_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal cumulPrecedentHt;

    @Column(name = "cumul_courant_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal cumulCourantHt;

    @Column(name = "travaux_periode_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal travauxPeriodeHt;

    @Column(name = "retenue_garantie_percent", nullable = false, precision = 8, scale = 4)
    private BigDecimal retenueGarantiePercent;

    @Column(name = "retenue_garantie_montant", nullable = false, precision = 18, scale = 4)
    private BigDecimal retenueGarantieMontant;

    @Column(name = "retenue_avance_percent", precision = 8, scale = 4)
    private BigDecimal retenueAvancePercent;

    @Column(name = "retenue_avance_montant", precision = 18, scale = 4)
    private BigDecimal retenueAvanceMontant;

    @Column(name = "net_a_payer_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal netAPayerHt;

    @Column(name = "tva_taux", nullable = false, precision = 8, scale = 4)
    private BigDecimal tvaTaux;

    @Column(name = "net_a_payer_ttc", nullable = false, precision = 18, scale = 4)
    private BigDecimal netAPayerTtc;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "facture_id", length = 100)
    private String factureId;

    @Column(name = "approbateur_moa_name", length = 200)
    private String approbateurMoaName;

    @Column(name = "approbation_date")
    private LocalDate approbationDate;

    @Column(name = "motif_rejet", length = 2000)
    private String motifRejet;

    @Column(length = 2000)
    private String notes;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (cumulPrecedentHt == null) {
            cumulPrecedentHt = BigDecimal.ZERO;
        }
        if (cumulCourantHt == null) {
            cumulCourantHt = BigDecimal.ZERO;
        }
        if (travauxPeriodeHt == null) {
            travauxPeriodeHt = BigDecimal.ZERO;
        }
        if (retenueGarantiePercent == null) {
            retenueGarantiePercent = BigDecimal.ZERO;
        }
        if (retenueGarantieMontant == null) {
            retenueGarantieMontant = BigDecimal.ZERO;
        }
        if (netAPayerHt == null) {
            netAPayerHt = BigDecimal.ZERO;
        }
        if (tvaTaux == null) {
            tvaTaux = new BigDecimal("20");
        }
        if (netAPayerTtc == null) {
            netAPayerTtc = BigDecimal.ZERO;
        }
        if (!StringUtils.hasText(status)) {
            status = STATUS_BROUILLON;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
