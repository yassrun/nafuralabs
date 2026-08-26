package ma.nafura.chantiers.domain.chantier;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "chantiers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Chantier implements Persistable<String> {

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

    /** Référence de l'ordre de service de démarrage (AC-6 cockpit). */
    @Column(name = "os_reference", length = 100)
    private String osReference;

    /** Date d'effet de l'ordre de service (AC-6 cockpit). */
    @Column(name = "os_date_effet")
    private LocalDate osDateEffet;

    @Column(name = "duree_mois")
    private Integer dureeMois;

    @Column(name = "date_fin_prevue")
    private LocalDate dateFinPrevue;

    @Column(name = "date_fin_reelle")
    private LocalDate dateFinReelle;

    @Column(name = "montant_ht", nullable = false, precision = 18, scale = 4)
    @JsonProperty("budgetHt")
    private BigDecimal montantHt;

    // ── Provenance commerciale et snapshot initial (continuite-etude-devis-chantier AC-9) ──
    // Posés une seule fois à la conversion depuis une étude GAGNE ; immutables ensuite.
    // Un chantier créé directement n'a aucune de ces références (AC-17).

    @Column(name = "dossier_etude_id")
    private UUID dossierEtudeId;

    @Column(name = "devis_id")
    private UUID devisId;

    @Column(name = "devis_numero", length = 50)
    private String devisNumero;

    @Column(name = "devis_version")
    private Integer devisVersion;

    @Column(name = "date_acceptation")
    private LocalDate dateAcceptation;

    /** Source de vente : {@code DEVIS} à la conversion ; null en création directe. */
    @Column(name = "source_vente", length = 20)
    private String sourceVente;

    /** Total HT de la version de devis approuvée et copiée — jamais recalculé (AC-10). */
    @Column(name = "montant_vente_initial_ht", precision = 18, scale = 4)
    private BigDecimal montantVenteInitialHt;

    /** Somme des déboursés initiaux copiés sur les nœuds — jamais recalculé (AC-10). */
    @Column(name = "debourse_initial_ht", precision = 18, scale = 4)
    private BigDecimal debourseInitialHt;

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

    /**
     * Avancement lu, jamais stocké (AC-2 / AC-3 du contrat avancement-et-attachement) : moyenne
     * des lots racines, pondérée à leur montant vendu (AC-4). Peuplé à la lecture par
     * {@link ma.nafura.chantiers.service.AvancementLectureService} ; {@code null} tant qu'aucun
     * nœud vendu ne porte de poids.
     */
    @Transient
    private BigDecimal avancementPercent;

    @Column(nullable = false, length = 40)
    private String status;

    @Column(name = "societe_id", length = 100)
    private String societeId;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    /**
     * Assigned string ids are otherwise treated as existing by Spring Data ({@code save} → merge).
     * New creates must persist as INSERT.
     */
    @Transient
    @Builder.Default
    @EqualsAndHashCode.Exclude
    private boolean newEntity = true;

    @Override
    public boolean isNew() {
        return newEntity;
    }

    @PostLoad
    @PostPersist
    void markNotNew() {
        newEntity = false;
    }

    @JsonProperty("isActive")
    public boolean isActive() {
        return active;
    }

    @JsonProperty("facturesEmisesHt")
    public BigDecimal getFacturesEmisesHt() {
        // AC-14 — le chantier ne tient pas ce chiffre : absent plutôt que faux zéro.
        return null;
    }

    @JsonProperty("encaissementsTtc")
    public BigDecimal getEncaissementsTtc() {
        return null;
    }

    @JsonProperty("cumulSituationsHt")
    public BigDecimal getCumulSituationsHt() {
        return null;
    }

    /**
     * AC-11 — vente active : le devis accepté tant qu'aucun marché n'est notifié. Le chantier ne
     * sait pas encore si un marché existe ; sans snapshot (création directe), la valeur reste
     * absente. Aucun fallback vers un autre montant.
     */
    @JsonProperty("montantVenteActifHt")
    public BigDecimal getMontantVenteActifHt() {
        return montantVenteInitialHt;
    }

    @JsonProperty("sourceVente")
    public String getSourceVenteJson() {
        return sourceVente;
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
        if (status == null || status.isBlank()) {
            status = STATUS_BROUILLON;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
