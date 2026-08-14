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
import lombok.NoArgsConstructor;

@Entity
@Table(name = "demandes_achat")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DemandeAchat {

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_SOUMISE = "SOUMISE";
    public static final String STATUS_APPROUVEE = "APPROUVEE";
    public static final String STATUS_REJETEE = "REJETEE";
    public static final String STATUS_CONVERTIE = "CONVERTIE";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "numero", nullable = false, length = 50)
    private String numero;

    @Column(name = "chantier_id", length = 100)
    private String chantierId;

    @Column(name = "chantier_code", length = 50)
    private String chantierCode;

    @Column(name = "chantier_name", length = 255)
    private String chantierName;

    @Column(name = "date_besoin", nullable = false)
    private LocalDate dateBesoin;

    @Column(name = "demandeur_id", nullable = false, length = 100)
    private String demandeurId;

    @Column(name = "demandeur_name", length = 255)
    private String demandeurName;

    @Column(name = "motif")
    private String motif;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "approbateur_id", length = 100)
    private String approbateurId;

    @Column(name = "approbateur_name", length = 255)
    private String approbateurName;

    @Column(name = "approbation_date")
    private LocalDate approbationDate;

    @Column(name = "motif_rejet")
    private String motifRejet;

    @Column(name = "bc_id", length = 100)
    private String bcId;

    @Column(name = "bc_numero", length = 50)
    private String bcNumero;

    @Column(name = "total_estime_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalEstimeHt;

    @Column(name = "notes")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "demande", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    @Builder.Default
    private List<DemandeAchatLigne> lignes = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.status == null) {
            this.status = STATUS_BROUILLON;
        }
        if (this.totalEstimeHt == null) {
            this.totalEstimeHt = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
