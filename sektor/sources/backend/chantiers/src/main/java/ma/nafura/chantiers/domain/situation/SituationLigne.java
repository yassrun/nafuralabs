package ma.nafura.chantiers.domain.situation;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Une ligne de situation — contrat {@code situation-et-retenues}, AC-2 et AC-3.
 *
 * <p>Pointe un <b>nœud</b> de l'arbre (poste ou lot-feuille), exactement comme {@code
 * AttachementLigne.noeudId} : le grain « lot seul » a disparu. {@code quantitePeriode} est la
 * somme de {@code AttachementLigne.quantitePeriode} sur les attachements que la situation
 * consomme (AC-3) ; {@code montantHt} est cette quantité au prix vendu du nœud. {@code
 * quantitePrecedente} / {@code quantiteCumulee} restent le contexte cumulatif affiché à l'écran
 * (AC-6), pas la base du calcul de {@code montantHt}.
 */
@Entity
@Table(name = "situation_lignes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SituationLigne {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "situation_id", nullable = false, length = 100)
    private String situationId;

    /** Le nœud de l'arbre du chantier dont vient la ligne — poste ou lot-feuille (AC-2). */
    @Column(name = "noeud_id", length = 100)
    private String noeudId;

    @Column(length = 120)
    private String code;

    @Column(nullable = false, length = 500)
    private String designation;

    @Column(length = 30)
    private String unite;

    @Column(name = "quantite_totale", precision = 18, scale = 4)
    private BigDecimal quantiteTotale;

    /** AC-3 — somme de quantitePeriode des attachements consommés, pour ce nœud. */
    @Column(name = "quantite_periode", nullable = false, precision = 18, scale = 4)
    private BigDecimal quantitePeriode;

    @Column(name = "quantite_precedente", nullable = false, precision = 18, scale = 4)
    private BigDecimal quantitePrecedente;

    @Column(name = "quantite_cumulee", nullable = false, precision = 18, scale = 4)
    private BigDecimal quantiteCumulee;

    @Column(name = "prix_unitaire", nullable = false, precision = 18, scale = 4)
    private BigDecimal prixUnitaire;

    /** AC-3 — quantitePeriode × prix unitaire vendu du nœud (pas la valeur cumulée). */
    @Column(name = "montant_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal montantHt;

    @Column(nullable = false)
    private int ordre;

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
        if (quantitePeriode == null) {
            quantitePeriode = BigDecimal.ZERO;
        }
        if (quantitePrecedente == null) {
            quantitePrecedente = BigDecimal.ZERO;
        }
        if (quantiteCumulee == null) {
            quantiteCumulee = BigDecimal.ZERO;
        }
        if (prixUnitaire == null) {
            prixUnitaire = BigDecimal.ZERO;
        }
        if (montantHt == null) {
            montantHt = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
