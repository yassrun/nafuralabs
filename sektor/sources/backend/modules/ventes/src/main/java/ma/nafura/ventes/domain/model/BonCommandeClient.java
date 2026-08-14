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
@Table(name = "bons_commande_client")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BonCommandeClient {

    public static final String STATUS_RECU = "RECU";
    public static final String STATUS_EN_COURS = "EN_COURS";
    public static final String STATUS_PARTIELLEMENT_FACTURE = "PARTIELLEMENT_FACTURE";
    public static final String STATUS_FACTURE = "FACTURE";
    public static final String STATUS_CLOTURE = "CLOTURE";
    public static final String STATUS_ANNULE = "ANNULE";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "numero", nullable = false, length = 50)
    private String numero;

    @Column(name = "numero_client", nullable = false, length = 100)
    private String numeroClient;

    @Column(name = "client_id", nullable = false, length = 100)
    private String clientId;

    @Column(name = "client_name", length = 255)
    private String clientName;

    @Column(name = "chantier_id", length = 100)
    private String chantierId;

    @Column(name = "chantier_code", length = 50)
    private String chantierCode;

    @Column(name = "date_reception", nullable = false)
    private LocalDate dateReception;

    @Column(name = "date_fin_prevue")
    private LocalDate dateFinPrevue;

    @Column(name = "montant_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal montantHt;

    @Column(name = "tva_taux", nullable = false, precision = 8, scale = 4)
    private BigDecimal tvaTaux;

    @Column(name = "montant_ttc", nullable = false, precision = 18, scale = 4)
    private BigDecimal montantTtc;

    @Column(name = "montant_facture_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal montantFactureHt;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "notes")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "bcc", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    @Builder.Default
    private List<BonCommandeClientLigne> lignes = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.status == null) {
            this.status = STATUS_RECU;
        }
        if (this.montantHt == null) {
            this.montantHt = BigDecimal.ZERO;
        }
        if (this.tvaTaux == null) {
            this.tvaTaux = new BigDecimal("20");
        }
        if (this.montantTtc == null) {
            this.montantTtc = BigDecimal.ZERO;
        }
        if (this.montantFactureHt == null) {
            this.montantFactureHt = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
