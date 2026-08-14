package ma.nafura.achats.domain.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
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
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "factures_fournisseur")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FactureFournisseur {

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_VALIDEE = "VALIDEE";
    public static final String STATUS_COMPTABILISEE = "COMPTABILISEE";
    public static final String STATUS_PARTIELLEMENT_PAYEE = "PARTIELLEMENT_PAYEE";
    public static final String STATUS_PAYEE = "PAYEE";
    public static final String STATUS_EN_LITIGE = "EN_LITIGE";
    public static final String STATUS_AVOIRISEE = "AVOIRISEE";
    public static final String STATUS_ANNULEE = "ANNULEE";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "numero_interne", nullable = false, length = 50)
    private String numeroInterne;

    @Column(name = "numero_fournisseur", length = 100)
    private String numeroFournisseur;

    @Column(name = "fournisseur_id", nullable = false, length = 100)
    private String fournisseurId;

    @Column(name = "fournisseur_name", length = 255)
    private String fournisseurName;

    @Column(name = "bc_id")
    private UUID bcId;

    @Column(name = "bc_numero", length = 50)
    private String bcNumero;

    @Column(name = "reception_id", length = 100)
    private String receptionId;

    @Column(name = "reception_numero", length = 255)
    private String receptionNumero;

    @Column(name = "chantier_id", length = 100)
    private String chantierId;

    @Column(name = "chantier_name", length = 255)
    private String chantierName;

    @Column(name = "rubrique", length = 50)
    private String rubrique;

    @Column(name = "date_facture", nullable = false)
    private LocalDate dateFacture;

    @Column(name = "date_reception")
    private LocalDate dateReception;

    @Column(name = "date_echeance", nullable = false)
    private LocalDate dateEcheance;

    @Column(name = "total_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalHt;

    @Column(name = "total_tva", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalTva;

    @Column(name = "total_ttc", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalTtc;

    @Column(name = "net_a_payer_ttc", nullable = false, precision = 18, scale = 4)
    private BigDecimal netAPayerTtc;

    @Column(name = "cumul_regle_ttc", nullable = false, precision = 18, scale = 4)
    private BigDecimal cumulRegleTtc;

    @Column(name = "reste_a_regler", nullable = false, precision = 18, scale = 4)
    private BigDecimal resteARegler;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "matching_status", length = 30)
    private String matchingStatus;

    @Column(name = "notes")
    private String notes;

    @Column(name = "motif_litige")
    private String motifLitige;

    @Column(name = "journal_entry_id")
    private UUID journalEntryId;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "facture", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    @Builder.Default
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private List<FactureFournisseurLigne> lignes = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.status == null) {
            this.status = STATUS_BROUILLON;
        }
        if (this.totalHt == null) {
            this.totalHt = BigDecimal.ZERO;
        }
        if (this.totalTva == null) {
            this.totalTva = BigDecimal.ZERO;
        }
        if (this.totalTtc == null) {
            this.totalTtc = BigDecimal.ZERO;
        }
        if (this.netAPayerTtc == null) {
            this.netAPayerTtc = BigDecimal.ZERO;
        }
        if (this.cumulRegleTtc == null) {
            this.cumulRegleTtc = BigDecimal.ZERO;
        }
        if (this.resteARegler == null) {
            this.resteARegler = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
