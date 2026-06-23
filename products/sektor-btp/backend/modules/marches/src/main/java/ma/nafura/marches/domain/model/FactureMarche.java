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
@Table(name = "factures_marche")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FactureMarche {

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_EMISE = "EMISE";
    public static final String STATUS_ENVOYEE_MOA = "ENVOYEE_MOA";
    public static final String STATUS_ACCEPTEE = "ACCEPTEE";
    public static final String STATUS_PAYEE = "PAYEE";
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

    @Column(name = "chantier_id", length = 100)
    private String chantierId;

    @Column(name = "chantier_code", length = 50)
    private String chantierCode;

    @Column(name = "client_nom", length = 255)
    private String clientNom;

    @Column(name = "montant_brut_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal montantBrutHt;

    @Column(name = "avance_deduite_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal avanceDeduiteHt;

    @Column(name = "retenue_garantie_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal retenueGarantieHt;

    @Column(name = "net_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal netHt;

    @Column(name = "tva_taux", nullable = false, precision = 8, scale = 4)
    private BigDecimal tvaTaux;

    @Column(name = "tva_montant", nullable = false, precision = 18, scale = 4)
    private BigDecimal tvaMontant;

    @Column(name = "net_ttc", nullable = false, precision = 18, scale = 4)
    private BigDecimal netTtc;

    @Column(name = "retenue_source_taux", nullable = false, precision = 8, scale = 4)
    private BigDecimal retenueSourceTaux;

    @Column(name = "retenue_source_montant", nullable = false, precision = 18, scale = 4)
    private BigDecimal retenueSourceMontant;

    @Column(name = "timbre_fiscal", nullable = false, precision = 18, scale = 4)
    private BigDecimal timbreFiscal;

    @Column(name = "net_a_payer", nullable = false, precision = 18, scale = 4)
    private BigDecimal netAPayer;

    @Column(name = "date_emission")
    private LocalDate dateEmission;

    @Column(name = "date_echeance")
    private LocalDate dateEcheance;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "facture_client_id", length = 100)
    private String factureClientId;

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
        if (this.montantBrutHt == null) {
            this.montantBrutHt = BigDecimal.ZERO;
        }
        if (this.avanceDeduiteHt == null) {
            this.avanceDeduiteHt = BigDecimal.ZERO;
        }
        if (this.retenueGarantieHt == null) {
            this.retenueGarantieHt = BigDecimal.ZERO;
        }
        if (this.netHt == null) {
            this.netHt = BigDecimal.ZERO;
        }
        if (this.tvaTaux == null) {
            this.tvaTaux = new BigDecimal("20");
        }
        if (this.tvaMontant == null) {
            this.tvaMontant = BigDecimal.ZERO;
        }
        if (this.netTtc == null) {
            this.netTtc = BigDecimal.ZERO;
        }
        if (this.retenueSourceTaux == null) {
            this.retenueSourceTaux = BigDecimal.ZERO;
        }
        if (this.retenueSourceMontant == null) {
            this.retenueSourceMontant = BigDecimal.ZERO;
        }
        if (this.timbreFiscal == null) {
            this.timbreFiscal = BigDecimal.ZERO;
        }
        if (this.netAPayer == null) {
            this.netAPayer = BigDecimal.ZERO;
        }
    }
}
