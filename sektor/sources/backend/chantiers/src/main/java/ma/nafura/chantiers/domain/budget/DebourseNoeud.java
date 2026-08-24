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
import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Déboursé prévu et révisé d'un nœud de l'arbre, pour une rubrique (AC-1, AC-7).
 *
 * <p><b>Le nœud porteur est le poste.</b> Un lot ou un sous-lot ne porte pas de ligne : son
 * déboursé est la somme de ses enfants et il ne se saisit pas (AC-1). Il n'y a donc qu'un seul
 * endroit où un montant est écrit, et aucun total ne peut diverger de ses composantes (AC-9).
 *
 * <p>Deux montants, jamais un seul :
 *
 * <ul>
 *   <li>{@code prevuHt} — la copie du DPU, datée, <b>jamais réécrite</b> après la conversion.
 *       C'est ce qui rend l'instantané vérifiable (AC-5) ;
 *   <li>{@code reviseHt} — initialisé à la valeur du prévu, seul montant qu'une correction
 *       touche (AC-7). L'écart entre les deux se lit à l'écran.
 * </ul>
 *
 * <p>Sur un nœud interne, la saisie initiale pose les deux à la même valeur : il n'y a pas de
 * copie à protéger, mais la forme reste la même partout (AC-6).
 */
@Entity
@Table(name = "debourses_noeuds")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DebourseNoeud {

    @Id
    @Column(length = 150)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    /** Le nœud porteur — toujours un poste, jamais un lot (AC-1). */
    @Column(name = "poste_id", nullable = false, length = 100)
    private String posteId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RubriqueDebourse rubrique;

    /** Copie du DPU (ou saisie initiale d'un interne). Figé après la conversion — AC-5, AC-7. */
    @Column(name = "prevu_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal prevuHt;

    /** Correction saisie à côté du prévu, initialisée à sa valeur — AC-7. */
    @Column(name = "revise_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal reviseHt;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    /** Identifiant lisible et stable — une seule ligne par (nœud, rubrique). */
    public static String buildId(String posteId, RubriqueDebourse rubrique) {
        return posteId + "-deb-" + rubrique.name().toLowerCase(Locale.ROOT).replace('_', '-');
    }

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (prevuHt == null) {
            prevuHt = BigDecimal.ZERO;
        }
        if (reviseHt == null) {
            reviseHt = prevuHt;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
