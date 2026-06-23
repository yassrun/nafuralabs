package ma.nafura.ventes.domain.model;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "factures_client")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FactureClient {

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_EMISE = "EMISE";
    public static final String STATUS_PARTIELLEMENT_PAYEE = "PARTIELLEMENT_PAYEE";
    public static final String STATUS_PAYEE = "PAYEE";
    public static final String STATUS_EN_LITIGE = "EN_LITIGE";
    public static final String STATUS_AVOIRISEE = "AVOIRISEE";
    public static final String STATUS_ANNULEE = "ANNULEE";

    public static final String TYPE_DIVERSE = "DIVERSE";
    public static final String TYPE_SITUATION = "SITUATION";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "numero", nullable = false, length = 50)
    private String numero;

    @Column(name = "type", nullable = false, length = 30)
    private String type;

    @Column(name = "client_id", nullable = false, length = 100)
    private String clientId;

    @Column(name = "client_name", length = 255)
    private String clientName;

    @Column(name = "bcc_id", length = 100)
    private String bccId;

    @Column(name = "chantier_id", length = 100)
    private String chantierId;

    @Column(name = "chantier_code", length = 50)
    private String chantierCode;

    @Column(name = "date_emission", nullable = false)
    private LocalDate dateEmission;

    @Column(name = "date_echeance", nullable = false)
    private LocalDate dateEcheance;

    @Column(name = "mode_paiement", length = 30)
    private String modePaiement;

    @Column(name = "total_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalHt;

    @Column(name = "retenue_garantie_taux", nullable = false, precision = 8, scale = 4)
    private BigDecimal retenueGarantieTaux;

    @Column(name = "retenue_garantie_montant", nullable = false, precision = 18, scale = 4)
    private BigDecimal retenueGarantieMontant;

    @Column(name = "resorption_avance_montant", nullable = false, precision = 18, scale = 4)
    private BigDecimal resorptionAvanceMontant;

    @Column(name = "net_a_payer_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal netAPayerHt;

    @Column(name = "tva_taux", nullable = false, precision = 8, scale = 4)
    private BigDecimal tvaTaux;

    @Column(name = "total_tva", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalTva;

    @Column(name = "ras_taux", nullable = false, precision = 8, scale = 4)
    @JsonProperty("retenueSourceTaux")
    private BigDecimal rasTaux;

    @Column(name = "ras_montant", nullable = false, precision = 18, scale = 4)
    @JsonProperty("retenueSourceMontantMad")
    @JsonAlias("rasMontant")
    private BigDecimal rasMontant;

    @Column(name = "marche_public", nullable = false)
    private Boolean marchePublic;

    @Column(name = "net_a_payer_ttc", nullable = false, precision = 18, scale = 4)
    private BigDecimal netAPayerTtc;

    @Column(name = "cumul_encaisse_ttc", nullable = false, precision = 18, scale = 4)
    private BigDecimal cumulEncaisseTtc;

    @Column(name = "reste_ttc", nullable = false, precision = 18, scale = 4)
    private BigDecimal resteTtc;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "notes")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "facture", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference("lignes")
    @Builder.Default
    private List<FactureClientLigne> lignes = new ArrayList<>();

    @OneToMany(mappedBy = "facture", fetch = FetchType.EAGER)
    @JsonManagedReference("encaissements")
    @Builder.Default
    private List<EncaissementClient> encaissements = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.status == null) {
            this.status = STATUS_BROUILLON;
        }
        if (this.type == null) {
            this.type = TYPE_DIVERSE;
        }
        if (this.totalHt == null) {
            this.totalHt = BigDecimal.ZERO;
        }
        if (this.retenueGarantieTaux == null) {
            this.retenueGarantieTaux = BigDecimal.ZERO;
        }
        if (this.retenueGarantieMontant == null) {
            this.retenueGarantieMontant = BigDecimal.ZERO;
        }
        if (this.resorptionAvanceMontant == null) {
            this.resorptionAvanceMontant = BigDecimal.ZERO;
        }
        if (this.netAPayerHt == null) {
            this.netAPayerHt = BigDecimal.ZERO;
        }
        if (this.tvaTaux == null) {
            this.tvaTaux = new BigDecimal("20");
        }
        if (this.totalTva == null) {
            this.totalTva = BigDecimal.ZERO;
        }
        if (this.rasTaux == null) {
            this.rasTaux = BigDecimal.ZERO;
        }
        if (this.rasMontant == null) {
            this.rasMontant = BigDecimal.ZERO;
        }
        if (this.marchePublic == null) {
            this.marchePublic = false;
        }
        if (this.netAPayerTtc == null) {
            this.netAPayerTtc = BigDecimal.ZERO;
        }
        if (this.cumulEncaisseTtc == null) {
            this.cumulEncaisseTtc = BigDecimal.ZERO;
        }
        if (this.resteTtc == null) {
            this.resteTtc = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
