package ma.nafura.ventes.domain.model;

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
import lombok.NoArgsConstructor;

@Entity
@Table(name = "offres_commerciales")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Offre {

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_ENVOYEE = "ENVOYEE";
    public static final String STATUS_ACCEPTEE = "ACCEPTEE";
    public static final String STATUS_REFUSEE = "REFUSEE";
    public static final String STATUS_EXPIREE = "EXPIREE";
    public static final String STATUS_ANNULEE = "ANNULEE";
    public static final String STATUS_CONVERTIE = "CONVERTIE";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "numero", nullable = false, length = 50)
    private String numero;

    @Column(name = "client_id", nullable = false, length = 100)
    private String clientId;

    @Column(name = "client_name", length = 255)
    private String clientName;

    @Column(name = "chantier_id", length = 100)
    private String chantierId;

    @Column(name = "chantier_code", length = 50)
    private String chantierCode;

    @Column(name = "date_emission", nullable = false)
    private LocalDate dateEmission;

    @Column(name = "date_validite", nullable = false)
    private LocalDate dateValidite;

    @Column(name = "objet", nullable = false, length = 500)
    private String objet;

    @Column(name = "total_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalHt;

    @Column(name = "tva_taux", nullable = false, precision = 8, scale = 4)
    private BigDecimal tvaTaux;

    @Column(name = "total_tva", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalTva;

    @Column(name = "total_ttc", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalTtc;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "motif_refus")
    private String motifRefus;

    @Column(name = "notes")
    private String notes;

    @Column(name = "bcc_id", length = 100)
    private String bccId;

    @Column(name = "bcc_numero", length = 50)
    private String bccNumero;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "offre", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    @Builder.Default
    private List<OffreLigne> lignes = new ArrayList<>();

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
        if (this.tvaTaux == null) {
            this.tvaTaux = new BigDecimal("20");
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
