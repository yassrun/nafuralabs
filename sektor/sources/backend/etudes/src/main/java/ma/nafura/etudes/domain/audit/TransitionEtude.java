package ma.nafura.etudes.domain.audit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Journal métier des transitions de l'étude et du devis (continuite-etude-devis-chantier AC-6).
 *
 * <p>Chaque passage d'état (étude {@code DEVIS_GENERE → GAGNE}, devis {@code → APPROUVE}, …)
 * est consigné avec l'ancien et le nouveau statut, l'acteur, la date et un identifiant de
 * corrélation commun aux deux écritures d'un même geste atomique. Un rejet d'autorisation ou
 * de cohérence n'écrit aucune ligne : la consignation suit la mutation dans la même transaction.
 *
 * <p>Ce journal n'est pas un second historique : il porte uniquement les transitions, pas les
 * données. Il complète {@code created_by / updated_by} ({@link EtudeAuditingListener}) qui ne
 * retient ni l'ancien statut, ni l'acteur d'une transition précise, ni la corrélation.
 */
@Entity
@Table(name = "transitions_etude")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransitionEtude {

    public static final String ENTITE_DOSSIER = "DOSSIER";
    public static final String ENTITE_DEVIS = "DEVIS";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    /** {@link #ENTITE_DOSSIER} ou {@link #ENTITE_DEVIS}. */
    @Column(name = "entite_type", nullable = false, length = 20)
    private String entiteType;

    @Column(name = "entite_id", nullable = false, length = 100)
    private String entiteId;

    @Column(name = "ancien_statut", nullable = false, length = 30)
    private String ancienStatut;

    @Column(name = "nouveau_statut", nullable = false, length = 30)
    private String nouveauStatut;

    /** Identifiant de corrélation commun aux écritures d'un même geste (AC-6). */
    @Column(name = "correlation_id", nullable = false)
    private UUID correlationId;

    /** Motif de dérogation (AC-4) ou de transition, consigné quand le geste en exige un. */
    @Column(name = "motif", length = 1000)
    private String motif;

    /** Montant de vente ayant fondé la décision de gain (AC-4). */
    @Column(name = "montant_vente_ht", precision = 18, scale = 4)
    private BigDecimal montantVenteHt;

    /** Déboursé initial comparé à la vente lors du gain (AC-4). */
    @Column(name = "debourse_initial_ht", precision = 18, scale = 4)
    private BigDecimal debourseInitialHt;

    /** Marge constatée au gain : vente moins déboursé (AC-4). */
    @Column(name = "marge_ht", precision = 18, scale = 4)
    private BigDecimal margeHt;

    @Column(name = "acteur", nullable = false, length = 100)
    private String acteur;

    @Column(name = "date_transition", nullable = false)
    private OffsetDateTime dateTransition;

    @PrePersist
    protected void onCreate() {
        if (this.dateTransition == null) {
            this.dateTransition = OffsetDateTime.now();
        }
    }
}
