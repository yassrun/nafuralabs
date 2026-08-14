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
@Table(name = "contrats_marche")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContratMarche {

    public static final String TYPE_FORFAITAIRE = "FORFAITAIRE";
    public static final String TYPE_BPU = "BPU";
    public static final String TYPE_METRE_QUANTITATIF = "METRE_QUANTITATIF";
    public static final String TYPE_MIXTE = "MIXTE";
    public static final String TYPE_REGIE = "REGIE";

    public static final String CCAG_TRAVAUX = "TRAVAUX";
    public static final String CCAG_SERVICE = "SERVICE";
    public static final String CCAG_FOURNITURE = "FOURNITURE";

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_NOTIFIE = "NOTIFIE";
    public static final String STATUS_EN_COURS = "EN_COURS";
    public static final String STATUS_RECEPTION_PROVISOIRE = "RECEPTION_PROVISOIRE";
    public static final String STATUS_RECEPTION_DEFINITIVE = "RECEPTION_DEFINITIVE";
    public static final String STATUS_CLOS = "CLOS";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "numero", nullable = false, length = 50)
    private String numero;

    @Column(name = "reference", length = 100)
    private String reference;

    @Column(name = "intitule", nullable = false, length = 500)
    private String intitule;

    @Column(name = "chantier_id", nullable = false, length = 100)
    private String chantierId;

    @Column(name = "chantier_code", length = 50)
    private String chantierCode;

    @Column(name = "chantier_nom", length = 255)
    private String chantierNom;

    @Column(name = "client_id", nullable = false, length = 100)
    private String clientId;

    @Column(name = "client_nom", length = 255)
    private String clientNom;

    @Column(name = "type_marche", nullable = false, length = 30)
    private String typeMarche;

    @Column(name = "type_ccag_t", nullable = false, length = 30)
    private String typeCcagT;

    @Column(name = "nature_marche", length = 30)
    private String natureMarche;

    @Column(name = "date_notification")
    private LocalDate dateNotification;

    @Column(name = "date_demarrage")
    private LocalDate dateDemarrage;

    @Column(name = "duree_mois")
    private Integer dureeMois;

    @Column(name = "montant_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal montantHt;

    @Column(name = "taux_tva", nullable = false, precision = 8, scale = 4)
    private BigDecimal tauxTva;

    @Column(name = "taux_rg", nullable = false, precision = 8, scale = 4)
    private BigDecimal tauxRg;

    @Column(name = "taux_ras", nullable = false, precision = 8, scale = 4)
    private BigDecimal tauxRas;

    @Column(name = "taux_avance", precision = 8, scale = 4)
    private BigDecimal tauxAvance;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

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
        if (this.typeMarche == null) {
            this.typeMarche = TYPE_FORFAITAIRE;
        }
        if (this.typeCcagT == null) {
            this.typeCcagT = CCAG_TRAVAUX;
        }
        if (this.montantHt == null) {
            this.montantHt = BigDecimal.ZERO;
        }
        if (this.tauxTva == null) {
            this.tauxTva = new BigDecimal("20");
        }
        if (this.tauxRg == null) {
            this.tauxRg = new BigDecimal("7");
        }
        if (this.tauxRas == null) {
            this.tauxRas = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
