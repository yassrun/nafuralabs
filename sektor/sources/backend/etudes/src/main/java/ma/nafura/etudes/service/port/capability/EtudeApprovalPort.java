package ma.nafura.etudes.service.port.capability;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

/**
 * Pont vers le moteur d'approbations (N+1 / N+2) sans coupler le module études.
 *
 * <p>Le No-Op laisse le dossier piloter seul {@code validationEtape}. L'adaptateur
 * produit crée une demande {@code ETUDE_PRIX} et synchronise les décisions.
 */
public interface EtudeApprovalPort {

    String ENTITY_TYPE = "ETUDE_PRIX";

    record ApprovalSnapshot(
            String requestId,
            String status,
            int etapeCouranteIndex,
            int etapeCount,
            String prochainApprobateurRole,
            String prochainApprobateurNom) {}

    boolean isAvailable();

    /** Crée (ou réutilise) la demande ouverte pour le dossier. */
    ApprovalSnapshot soumettre(
            UUID dossierId,
            String numero,
            String resume,
            BigDecimal montantHt,
            String initiateurUserId,
            String initiateurNom);

    /** Approuve l'étape courante ; retourne l'état après décision. */
    ApprovalSnapshot approuverEtape(String requestId, String userId, String userNom, String commentaire);

    /** Refuse la demande ouverte. */
    ApprovalSnapshot refuser(String requestId, String userId, String userNom, String motif);

    /** Approuve les étapes restantes jusqu'à clôture. No-op si déjà close. */
    ApprovalSnapshot cloreApprouvee(String requestId, String userId, String userNom, String commentaire);

    /** Annule la demande ouverte. No-op si déjà close. */
    ApprovalSnapshot annuler(String requestId, String userId, String userNom, String motif);

    Optional<ApprovalSnapshot> trouverOuverte(UUID dossierId);
}
