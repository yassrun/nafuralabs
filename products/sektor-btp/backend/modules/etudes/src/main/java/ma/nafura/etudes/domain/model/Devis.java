package ma.nafura.etudes.domain.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "devis")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Devis {

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_EMIS = "EMIS";
    public static final String STATUS_NEGOCIATION = "NEGOCIATION";
    public static final String STATUS_APPROUVE = "APPROUVE";
    public static final String STATUS_PERDU = "PERDU";
    public static final String STATUS_ANNULE = "ANNULE";
    public static final String STATUS_EXPIRE = "EXPIRE";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "numero", nullable = false, length = 50)
    private String numero;

    @Column(name = "version", nullable = false)
    private Integer version;

    @Column(name = "client_id", nullable = false, length = 100)
    private String clientId;

    @Column(name = "client_name", length = 255)
    private String clientName;

    @Column(name = "contact_client", length = 255)
    private String contactClient;

    @Column(name = "objet", nullable = false, length = 500)
    private String objet;

    @Column(name = "ville", length = 255)
    private String ville;

    @Column(name = "date_emission", nullable = false)
    private LocalDate dateEmission;

    @Column(name = "date_validite", nullable = false)
    private LocalDate dateValidite;

    @Column(name = "metre_id")
    @JsonIgnore
    private UUID metreId;

    @Column(name = "dpgf_id")
    @JsonIgnore
    private UUID dpgfId;

    @Column(name = "bibliotheque_reference", length = 255)
    private String bibliothequeReference;

    @Column(name = "conditions_paiement", nullable = false, length = 500)
    private String conditionsPaiement;

    @Column(name = "delai_execution_jours")
    private Integer delaiExecutionJours;

    @Column(name = "total_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalHt;

    @Column(name = "tva_taux", nullable = false, precision = 8, scale = 4)
    private BigDecimal tvaTaux;

    @Column(name = "total_tva", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalTva;

    @Column(name = "total_ttc", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalTtc;

    @Column(name = "remise_globale_percent", precision = 8, scale = 4)
    private BigDecimal remiseGlobalePercent;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "motif_refus")
    private String motifRefus;

    @Column(name = "chantier_genere_id", length = 100)
    private String chantierGenereId;

    @Column(name = "notes")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "devis", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    @OrderBy("ordre ASC")
    @Builder.Default
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private List<DevisLigne> lignes = new ArrayList<>();

    @OneToMany(mappedBy = "devis", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference("devisVersions")
    @OrderBy("version ASC")
    @Builder.Default
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private List<DevisVersion> historiqueVersions = new ArrayList<>();

    @JsonProperty("metreId")
    public String getMetreIdJson() {
        return metreId != null ? metreId.toString() : null;
    }

    @JsonProperty("dpgfId")
    public String getDpgfIdJson() {
        return dpgfId != null ? dpgfId.toString() : null;
    }

    @JsonProperty("nbLignes")
    public int getNbLignes() {
        return lignes != null ? lignes.size() : 0;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.version == null) {
            this.version = 1;
        }
        if (this.status == null) {
            this.status = STATUS_BROUILLON;
        }
        if (this.tvaTaux == null) {
            this.tvaTaux = new BigDecimal("20");
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
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
