package ma.nafura.etudes.domain.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.nafura.etudes.domain.audit.AuditableEtude;
import ma.nafura.etudes.domain.audit.EtudeAuditingListener;

/**
 * Dossier d'étude de prix — l'agrégat orchestrateur du parcours.
 *
 * <p>Il ne stocke <b>aucune donnée de prix</b> : le bordereau et son chiffrage vivent dans
 * {@link Dpgf} / {@link DpgfNoeud} / {@link PrixDpu}. Ce dossier porte le parcours (étape
 * courante, statut), les sources documentaires et les liens amont/aval.
 *
 * <p>C'est ce qui manquait à {@code etudes} : des briques existaient sans parcours qui les
 * relie. Le module {@code consultation} avait ce parcours mais avec un modèle de données
 * concurrent — voir {@code products/sektor-btp/docs/epics/etude-prix-unifiee/}.
 */
@Entity
@Table(name = "dossiers_etude")
@EntityListeners(EtudeAuditingListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DossierEtude implements AuditableEtude {

    /** Étapes du parcours. */
    public static final int ETAPE_BORDEREAU = 1;
    public static final int ETAPE_DESCRIPTIFS = 2;
    public static final int ETAPE_DECOMPOSITION = 3;
    public static final int ETAPE_CONSULTATION_FOURNISSEURS = 4;
    public static final int ETAPE_CHIFFRAGE = 5;

    /** Origine du dossier : étude classique, ou marché déjà attribué (entrée B, lot 7). */
    public static final String ORIGINE_ETUDE = "ETUDE";
    public static final String ORIGINE_MARCHE_EXISTANT = "MARCHE_EXISTANT";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "numero", nullable = false, length = 50)
    private String numero;

    @Column(name = "objet", nullable = false, length = 500)
    private String objet;

    @Column(name = "client_id", length = 100)
    private String clientId;

    @Column(name = "client_nom", length = 255)
    private String clientNom;

    // ── Sources documentaires ────────────────────────────────────────────────

    @Column(name = "cps_document_id", length = 100)
    private String cpsDocumentId;

    @Column(name = "bordereau_document_id", length = 100)
    private String bordereauDocumentId;

    @Column(name = "appel_offre_client_id")
    private UUID appelOffreClientId;

    // ── Contenu, délégué au DPGF ─────────────────────────────────────────────

    @Column(name = "dpgf_id")
    private UUID dpgfId;

    // ── Parcours ─────────────────────────────────────────────────────────────

    @Column(name = "current_step", nullable = false)
    @Builder.Default
    private Integer currentStep = ETAPE_BORDEREAU;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private StatutDossierEtude status = StatutDossierEtude.BROUILLON;

    @Column(name = "origine", nullable = false, length = 30)
    @Builder.Default
    private String origine = ORIGINE_ETUDE;

    // ── Paramètres d'étude ───────────────────────────────────────────────────
    // Valeurs de départ appliquées aux PrixDpu créés dans ce dossier. Ce ne sont PAS des
    // règles : l'expert métier pose une marge par article, variable. Voir Q14.

    @Column(name = "frais_generaux_percent_defaut", precision = 8, scale = 4)
    private BigDecimal fraisGenerauxPercentDefaut;

    @Column(name = "marge_percent_defaut", precision = 8, scale = 4)
    private BigDecimal margePercentDefaut;

    @Column(name = "tva_taux_defaut", precision = 8, scale = 4)
    private BigDecimal tvaTauxDefaut;

    /**
     * Marge globale éventuelle, par-dessus les marges par article.
     *
     * <p>Sémantique non tranchée (composée ou cible — voir Q15) : laisser {@code null} tant
     * que l'expert métier n'a pas répondu. Le champ est provisionné parce qu'il serait une
     * migration une fois la table en production.
     */
    @Column(name = "marge_globale_percent", precision = 8, scale = 4)
    private BigDecimal margeGlobalePercent;

    // ── Aval ─────────────────────────────────────────────────────────────────

    @Column(name = "devis_genere_id")
    private UUID devisGenereId;

    @Column(name = "motif_refus", length = 1000)
    private String motifRefus;

    @Column(name = "notes")
    private String notes;

    // ── Audit ────────────────────────────────────────────────────────────────

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @Version
    @Column(name = "version", nullable = false)
    @Builder.Default
    private Long version = 0L;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @JsonProperty("dpgfId")
    public String getDpgfIdJson() {
        return dpgfId != null ? dpgfId.toString() : null;
    }

    @JsonProperty("modifiable")
    public boolean isModifiable() {
        return status != null && status.estModifiable();
    }

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.status == null) {
            this.status = StatutDossierEtude.BROUILLON;
        }
        if (this.currentStep == null) {
            this.currentStep = ETAPE_BORDEREAU;
        }
        if (this.origine == null) {
            this.origine = ORIGINE_ETUDE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
