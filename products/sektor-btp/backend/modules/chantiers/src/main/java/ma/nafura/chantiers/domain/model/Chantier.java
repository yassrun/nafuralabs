package ma.nafura.chantiers.domain.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "chantiers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Chantier {

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_EN_PREPARATION = "EN_PREPARATION";
    public static final String STATUS_EN_COURS = "EN_COURS";
    public static final String STATUS_SUSPENDU = "SUSPENDU";
    public static final String STATUS_RECEPTION_PROVISOIRE = "RECEPTIONNE_PROVISOIRE";
    public static final String STATUS_RECEPTION_DEFINITIF = "RECEPTIONNE_DEFINITIF";
    public static final String STATUS_CLOS = "CLOS";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 50)
    private String code;

    @Column(nullable = false)
    @JsonProperty("name")
    private String label;

    private String description;

    @Column(name = "chantier_type", nullable = false, length = 30)
    @JsonProperty("type")
    private String chantierType;

    @Column(name = "client_id", length = 100)
    private String clientId;

    @Column(name = "client_name")
    private String clientName;

    @Column(name = "marche_numero", length = 100)
    @JsonProperty("marcheReference")
    private String marcheNumero;

    @Column(name = "type_ccag_t", length = 30)
    private String typeCcagT;

    @Column(name = "moa_id", length = 100)
    private String moaId;

    @Column(name = "moe_id", length = 100)
    private String moeId;

    @Column(name = "bet_id", length = 100)
    private String betId;

    private String adresse;

    private String ville;

    private BigDecimal latitude;

    private BigDecimal longitude;

    @Column(name = "date_demarrage")
    @JsonProperty("dateDebut")
    private LocalDate dateDemarrage;

    @Column(name = "duree_mois")
    private Integer dureeMois;

    @Column(name = "date_fin_prevue")
    private LocalDate dateFinPrevue;

    @Column(name = "date_fin_reelle")
    private LocalDate dateFinReelle;

    @Column(name = "montant_ht", nullable = false, precision = 18, scale = 4)
    @JsonProperty("budgetHt")
    private BigDecimal montantHt;

    @Column(name = "taux_tva", nullable = false, precision = 8, scale = 4)
    @JsonProperty("tvaTaux")
    private BigDecimal tauxTva;

    @Column(name = "taux_rg", precision = 8, scale = 4)
    @JsonProperty("cautionGarantie")
    private BigDecimal tauxRg;

    @Column(name = "taux_ras", precision = 8, scale = 4)
    private BigDecimal tauxRas;

    @Column(name = "taux_avance", precision = 8, scale = 4)
    @JsonProperty("avancePercue")
    private BigDecimal tauxAvance;

    @Column(name = "avancement_percent", nullable = false, precision = 8, scale = 4)
    private BigDecimal avancementPercent;

    @Column(nullable = false, length = 40)
    private String status;

    @Column(name = "chef_chantier_user_id", length = 100)
    private String chefChantierUserId;

    @Column(name = "chef_chantier_name")
    private String chefChantierName;

    @Column(name = "conducteur_travaux_user_id", length = 100)
    private String conducteurTravauxUserId;

    @Column(name = "conducteur_travaux_name")
    private String conducteurTravauxName;

    @Column(name = "ingenieur_user_id", length = 100)
    private String ingenieurUserId;

    @Column(name = "ingenieur_name")
    private String ingenieurName;

    @Column(name = "societe_id", length = 100)
    private String societeId;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @JsonProperty("isActive")
    public boolean isActive() {
        return active;
    }

    @JsonProperty("facturesEmisesHt")
    public BigDecimal getFacturesEmisesHt() {
        return BigDecimal.ZERO;
    }

    @JsonProperty("encaissementsTtc")
    public BigDecimal getEncaissementsTtc() {
        return BigDecimal.ZERO;
    }

    @JsonProperty("cumulSituationsHt")
    public BigDecimal getCumulSituationsHt() {
        return BigDecimal.ZERO;
    }

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (montantHt == null) {
            montantHt = BigDecimal.ZERO;
        }
        if (tauxTva == null) {
            tauxTva = new BigDecimal("20");
        }
        if (avancementPercent == null) {
            avancementPercent = BigDecimal.ZERO;
        }
        if (status == null || status.isBlank()) {
            status = STATUS_BROUILLON;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
