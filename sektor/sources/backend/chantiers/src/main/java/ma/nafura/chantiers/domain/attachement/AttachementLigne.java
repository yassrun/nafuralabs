package ma.nafura.chantiers.domain.attachement;

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
 * Une ligne d'attachement — contrat {@code avancement-et-attachement}, AC-11 à AC-14.
 *
 * <p>Montée depuis les déclarations d'avancement de la période, jamais tapée : elle ne porte que
 * le lien vers son nœud, la quantité de la période et une zone facultative. Code, désignation,
 * unité et prix unitaire vendu sont **lus sur le nœud** à la lecture (AC-12) — jamais recopiés
 * ici, pour ne jamais diverger de l'arbre du chantier.
 */
@Entity
@Table(name = "attachement_lignes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttachementLigne {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "attachement_id", nullable = false, length = 100)
    private String attachementId;

    /** Le nœud de l'arbre du chantier dont vient la ligne — un poste, ou un lot-feuille (AC-12). */
    @Column(name = "noeud_id", nullable = false, length = 100)
    private String noeudId;

    /** AC-11 — somme des déclarations du nœud sur la période de l'attachement. */
    @Column(name = "quantite_periode", nullable = false, precision = 18, scale = 4)
    private BigDecimal quantitePeriode;

    /** AC-14 — facultative, prise dans le référentiel de zones du chantier. */
    @Column(name = "zone_id", length = 100)
    private String zoneId;

    @Column(nullable = false)
    private Integer ordre;

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
        if (ordre == null) {
            ordre = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
