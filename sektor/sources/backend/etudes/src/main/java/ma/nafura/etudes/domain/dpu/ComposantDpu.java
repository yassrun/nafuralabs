package ma.nafura.etudes.domain.dpu;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.nafura.catalogue.api.CatalogPriceSource;

@Entity
@Table(name = "composants_dpu")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class ComposantDpu {

    public static final String TYPE_MATIERE = "MATIERE";
    public static final String TYPE_MAIN_DOEUVRE = "MAIN_DOEUVRE";
    public static final String TYPE_MATERIEL = "MATERIEL";
    public static final String TYPE_SOUS_TRAITANCE = "SOUS_TRAITANCE";

    /**
     * Base du rendement — constatee sur le sous-detail reel de l'entreprise (2026-07-19).
     *
     * <p>PAR_UNITE : le rendement est deja rapporte a une unite d'ouvrage. Exemple reel,
     * ouvrage « coffrage » : 0,5 jour de coffreur par m3.
     *
     * <p>PAR_JOUR : le composant est chiffre a la journee, et le cout est ramene a l'unite en
     * divisant par le rendement journalier de l'ouvrage. Exemple reel, ouvrage
     * « Production » : betonniere 400 + eau 100 + tracteur 1000 + 5 j de MO a 150 = 2 250 DH
     * par jour, divise par 30 m3/jour = 75 DH/m3.
     *
     * <p>Les deux coexistent dans un meme ouvrage : sur « Deblais en masse », la tractopelle
     * et les pannes sont journalieres (÷ 100 m3/jour) tandis que le gasoil est deja au m3.
     */
    public static final String BASE_PAR_UNITE = "PAR_UNITE";
    public static final String BASE_PAR_JOUR = "PAR_JOUR";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prix_dpu_id", nullable = false)
    @JsonBackReference
    private PrixDpu prixDpu;

    @Column(name = "type", nullable = false, length = 30)
    private String type;

    /** ITEM | OUVRAGE | LIBRE */
    @Column(name = "reference_type", nullable = false, length = 20)
    private String referenceType;

    @Column(name = "item_id")
    private UUID itemId;

    /** Référence typée vers un ouvrage (composite) — distinct du parent PrixDpu.ouvrage. */
    @Column(name = "ouvrage_id")
    private UUID ouvrageId;

    /** Toujours renseigné — l'affichage ne dépend pas de la résolution catalogue. */
    @Column(name = "libelle", nullable = false, length = 500)
    private String libelle;

    /**
     * L9 — « ne sera jamais un article » (aléas, amenée/repli…).
     * Exclu définitivement du rattrapage.
     */
    @Column(name = "hors_referentiel", nullable = false)
    @Builder.Default
    private Boolean horsReferentiel = false;

    /**
     * L10 — sous-traitance : remonter le prix de vente du sous-ouvrage (FG+marge inclus).
     * Défaut false = déboursé uniquement (anti marge-sur-marge).
     */
    @Column(name = "inclure_frais_et_marge", nullable = false)
    @Builder.Default
    private Boolean inclureFraisEtMarge = false;

    /**
     * Quantité de ce composant nécessaire pour UNE unité d'ouvrage (ex. 350 kg de ciment par m³).
     * Ce n'est PAS une quantité absolue — ne jamais multiplier par la quantité du bordereau ici.
     */
    @Column(name = "rendement", nullable = false, precision = 18, scale = 4)
    @JsonProperty("rendement")
    private BigDecimal rendement;

    /**
     * PAR_UNITE (defaut) ou PAR_JOUR — voir les constantes {@code BASE_*}.
     *
     * <p>Un composant PAR_JOUR n'a de sens que si son {@code PrixDpu} porte un
     * {@code rendementJournalier} : sans lui, on ne sait pas ramener le cout a l'unite.
     */
    @Column(name = "base_rendement", length = 20)
    private String baseRendement;

    @Column(name = "unite", nullable = false, length = 30)
    private String unite;

    @Column(name = "prix_unitaire", nullable = false, precision = 18, scale = 4)
    @JsonProperty("prixUnitaire")
    private BigDecimal prixUnitaire;

    @Column(name = "total", nullable = false, precision = 18, scale = 4)
    private BigDecimal total;

    @Column(name = "ordre", nullable = false)
    private Integer ordre;

    @Column(name = "source_prix", nullable = false, length = 20)
    private String sourcePrix;

    @Column(name = "offre_fournisseur_id")
    private UUID offreFournisseurId;

    /** Snapshot gel — id de la ligne catalogue / ItemPrice / offre d'origine. */
    @Column(name = "prix_source_ref_id")
    private UUID prixSourceRefId;

    @Column(name = "prix_date_source")
    private LocalDate prixDateSource;

    @Column(name = "prix_currency_id")
    private UUID prixCurrencyId;

    /** Ex. « Catalogue Lafarge — 12/06/2026 » — lisible même si la source a disparu. */
    @Column(name = "prix_libelle_source", length = 500)
    private String prixLibelleSource;

    @Column(name = "suggere_par_ia", nullable = false)
    private Boolean suggereParIa;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    /** Alias JSON lecture (compat front) — ne pas utiliser en écriture métier. */
    @JsonProperty("quantite")
    public BigDecimal getQuantite() {
        return rendement;
    }

    @JsonSetter("quantite")
    public void setQuantite(BigDecimal quantite) {
        this.rendement = quantite;
    }

    /**
     * Compat snapshots / front legacy : {@code articleOuPosteId} → libellé LIBRE.
     */
    @JsonSetter("articleOuPosteId")
    public void setArticleOuPosteIdLegacy(String articleOuPosteId) {
        if (this.libelle == null && articleOuPosteId != null && !articleOuPosteId.isBlank()) {
            this.libelle = articleOuPosteId.trim();
        }
        if (this.referenceType == null) {
            this.referenceType = "LIBRE";
        }
    }

    /** Alias lecture legacy pour le front en transition. */
    @JsonProperty("articleOuPosteId")
    public String getArticleOuPosteId() {
        return libelle;
    }

    /** Un composant sans base declaree est au rendement unitaire — le cas le plus courant. */
    public boolean estJournalier() {
        return BASE_PAR_JOUR.equals(baseRendement);
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.ordre == null) {
            this.ordre = 0;
        }
        if (this.sourcePrix == null) {
            this.sourcePrix = CatalogPriceSource.MANUEL;
        }
        if (this.suggereParIa == null) {
            this.suggereParIa = false;
        }
        if (this.referenceType == null) {
            this.referenceType = "LIBRE";
        }
        if (this.horsReferentiel == null) {
            this.horsReferentiel = false;
        }
        if (this.inclureFraisEtMarge == null) {
            this.inclureFraisEtMarge = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
