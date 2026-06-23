package ma.nafura.achats.domain.model;

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
@Table(name = "contrats_fournisseur")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContratFournisseur {

    public static final String TYPE_FOURNISSEUR = "FOURNISSEUR";
    public static final String TYPE_SOUS_TRAITANCE = "SOUS_TRAITANCE";

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_SIGNE = "SIGNE";
    public static final String STATUS_EN_COURS = "EN_COURS";
    public static final String STATUS_ECHU = "ECHU";
    public static final String STATUS_RESILIE = "RESILIE";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "numero", nullable = false, length = 50)
    private String numero;

    @Column(name = "type", nullable = false, length = 30)
    private String type;

    @Column(name = "fournisseur_id", nullable = false, length = 100)
    private String fournisseurId;

    @Column(name = "chantier_id", length = 100)
    private String chantierId;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin", nullable = false)
    private LocalDate dateFin;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "montant_ht", precision = 18, scale = 4)
    private BigDecimal montantHt;

    @Column(name = "art187_declare", nullable = false)
    private Boolean art187Declare;

    @Column(name = "art187_valide_moa", nullable = false)
    private Boolean art187ValideMoa;

    @Column(name = "retenue_garantie_taux", precision = 8, scale = 4)
    private BigDecimal retenueGarantieTaux;

    @Column(name = "paiement_direct_moa", nullable = false)
    private Boolean paiementDirectMoa;

    @Column(name = "notes")
    private String notes;

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
        if (this.type == null) {
            this.type = TYPE_FOURNISSEUR;
        }
        if (this.art187Declare == null) {
            this.art187Declare = false;
        }
        if (this.art187ValideMoa == null) {
            this.art187ValideMoa = false;
        }
        if (this.paiementDirectMoa == null) {
            this.paiementDirectMoa = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
