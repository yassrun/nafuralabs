package ma.nafura.chantiers.domain.budget;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

/**
 * Un coût réel imputé sur un nœud de l'arbre (AC-10).
 *
 * <p>Quatre choses, et rien d'autre : un <b>nœud</b>, une <b>rubrique</b>, un <b>montant</b>, une
 * <b>date</b>. Aucune activité, aucune zone, aucune quotité — ni ici, ni dans la saisie, ni dans
 * le calcul. C'est ce qui rend le budget, la marge et l'écart justes sur un chantier qui n'a
 * aucun planning (AC-14).
 *
 * <p>Un coût qui arrive sans nœud n'est pas refusé et ne reste pas en vrac : il tombe sur le
 * nœud interne « Frais de chantier », créé à la première imputation de ce type, et reste
 * ré-imputable ensuite (AC-11).
 */
@Entity
@Table(name = "couts_reels_noeuds")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoutReelNoeud {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    /** Redondant avec le lot du poste, mais c'est la clé de lecture d'un chantier entier. */
    @Column(name = "chantier_id", nullable = false, length = 100)
    private String chantierId;

    /** Le nœud imputé — toujours un poste, vendu ou interne. Jamais nul après écriture (AC-11). */
    @Column(name = "poste_id", nullable = false, length = 100)
    private String posteId;

    /**
     * Une des <b>quatre</b> rubriques. {@code NON_VENTILE} est le constat d'un chiffrage prévu
     * qu'on n'a pas su décomposer : une dépense réelle, elle, sait toujours ce qu'elle a payé.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RubriqueDebourse rubrique;

    @Column(name = "montant_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal montantHt;

    @Column(name = "date_cout", nullable = false)
    private LocalDate dateCout;

    @Column(length = 500)
    private String libelle;

    /**
     * D'où vient la pièce — pointage, facture, sortie de magasin, saisie. Texte libre : ce
     * contrat dit <b>où</b> le réel tombe, pas comment chaque module l'y met.
     */
    @Column(length = 50)
    private String source;

    /** Vrai tant que la dépense est arrivée sans nœud et attend sa ré-imputation (AC-11). */
    @Column(name = "impute_par_defaut", nullable = false)
    @Builder.Default
    private Boolean imputeParDefaut = false;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

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
        if (imputeParDefaut == null) {
            imputeParDefaut = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
