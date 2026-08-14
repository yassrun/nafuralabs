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
@Table(name = "bons_commande_achat")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BonCommandeAchat {

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_VALIDE = "VALIDE";
    public static final String STATUS_ENVOYE = "ENVOYE";
    public static final String STATUS_ACCUSE_RECEPTION = "ACCUSE_RECEPTION";
    public static final String STATUS_PARTIELLEMENT_LIVRE = "PARTIELLEMENT_LIVRE";
    public static final String STATUS_LIVRE = "LIVRE";
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

    @Column(name = "fournisseur_id", nullable = false, length = 100)
    private String fournisseurId;

    @Column(name = "fournisseur_name", length = 255)
    private String fournisseurName;

    @Column(name = "chantier_id", length = 100)
    private String chantierId;

    @Column(name = "chantier_code", length = 50)
    private String chantierCode;

    @Column(name = "chantier_name", length = 255)
    private String chantierName;

    @Column(name = "da_id", length = 100)
    private String daId;

    @Column(name = "da_numero", length = 50)
    private String daNumero;

    @Column(name = "ao_id", length = 100)
    private String aoId;

    @Column(name = "ao_numero", length = 50)
    private String aoNumero;

    @Column(name = "contrat_id", length = 100)
    private String contratId;

    @Column(name = "contrat_numero", length = 50)
    private String contratNumero;

    @Column(name = "rubrique", length = 50)
    private String rubrique;

    @Column(name = "date_creation", nullable = false)
    private LocalDate dateCreation;

    @Column(name = "date_livraison_prevue", nullable = false)
    private LocalDate dateLivraisonPrevue;

    @Column(name = "conditions_paiement", nullable = false, length = 255)
    private String conditionsPaiement;

    @Column(name = "mode_reglement", length = 30)
    private String modeReglement;

    @Column(name = "total_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalHt;

    @Column(name = "tva_taux", nullable = false, precision = 8, scale = 4)
    private BigDecimal tvaTaux;

    @Column(name = "total_ttc", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalTtc;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "validateur_id", length = 100)
    private String validateurId;

    @Column(name = "validateur_name", length = 255)
    private String validateurName;

    @Column(name = "validation_date")
    private LocalDate validationDate;

    @Column(name = "total_livre_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalLivreHt;

    @Column(name = "total_facture_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalFactureHt;

    @Column(name = "notes")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "bonCommande", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    @Builder.Default
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private List<BonCommandeAchatLigne> lignes = new ArrayList<>();

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
        if (this.totalTtc == null) {
            this.totalTtc = BigDecimal.ZERO;
        }
        if (this.totalLivreHt == null) {
            this.totalLivreHt = BigDecimal.ZERO;
        }
        if (this.totalFactureHt == null) {
            this.totalFactureHt = BigDecimal.ZERO;
        }
        if (this.dateCreation == null) {
            this.dateCreation = LocalDate.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
