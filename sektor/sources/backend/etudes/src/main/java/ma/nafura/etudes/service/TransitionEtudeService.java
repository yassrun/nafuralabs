package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.util.UUID;
import ma.nafura.etudes.domain.audit.TransitionEtude;
import ma.nafura.etudes.repository.TransitionEtudeRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Consigne les transitions de l'étude et du devis dans le journal métier
 * (continuite-etude-devis-chantier AC-6).
 *
 * <p>Un même geste atomique (gain, conversion) consigne plusieurs transitions avec le même
 * {@code correlationId} : c'est ce qui relie l'écriture étude et l'écriture devis. L'acteur
 * vient de {@link UserContext}, la date est posée à la persistance. La consignation vit dans
 * la transaction de la mutation : si elle échoue, rien n'est écrit, ni état ni journal.
 */
@Service
public class TransitionEtudeService {

    private final TransitionEtudeRepository repository;

    public TransitionEtudeService(TransitionEtudeRepository repository) {
        this.repository = repository;
    }

    /**
     * Consigne une transition (étude ou devis) rattachée à un geste atomique.
     *
     * @param entiteType     {@link TransitionEtude#ENTITE_DOSSIER} ou {@link TransitionEtude#ENTITE_DEVIS}
     * @param entiteId       identifiant de l'entité
     * @param ancienStatut   statut avant la transition (jamais null)
     * @param nouveauStatut  statut après la transition (jamais null)
     * @param correlationId  identifiant commun du geste (gain, conversion, …)
     * @param motif          motif éventuel (dérogation AC-4, autre)
     */
    @Transactional
    public void consigner(
            String entiteType,
            String entiteId,
            String ancienStatut,
            String nouveauStatut,
            UUID correlationId,
            String motif) {
        consignerInterne(
                entiteType, entiteId, ancienStatut, nouveauStatut, correlationId, motif,
                null, null, null);
    }

    /**
     * Consigne une transition de gain avec les valeurs discriminantes de la décision (AC-4).
     */
    @Transactional
    public void consignerGain(
            String entiteType,
            String entiteId,
            String ancienStatut,
            String nouveauStatut,
            UUID correlationId,
            String motif,
            BigDecimal montantVenteHt,
            BigDecimal debourseInitialHt,
            BigDecimal margeHt) {
        consignerInterne(
                entiteType, entiteId, ancienStatut, nouveauStatut, correlationId, motif,
                montantVenteHt, debourseInitialHt, margeHt);
    }

    private void consignerInterne(
            String entiteType,
            String entiteId,
            String ancienStatut,
            String nouveauStatut,
            UUID correlationId,
            String motif,
            BigDecimal montantVenteHt,
            BigDecimal debourseInitialHt,
            BigDecimal margeHt) {
        TransitionEtude entree = TransitionEtude.builder()
                .tenantId(TenantContext.getTenantId())
                .entiteType(entiteType)
                .entiteId(entiteId)
                .ancienStatut(ancienStatut)
                .nouveauStatut(nouveauStatut)
                .correlationId(correlationId)
                .motif(StringUtils.hasText(motif) ? motif.trim() : null)
                .montantVenteHt(montantVenteHt)
                .debourseInitialHt(debourseInitialHt)
                .margeHt(margeHt)
                .acteur(acteurCourant())
                .build();
        repository.save(entree);
    }

    /** Acteur courant — même règle que {@code EtudeAuditingListener} : uid, sinon email, sinon system. */
    private static String acteurCourant() {
        UUID userId = UserContext.getUserIdOrNull();
        if (userId != null) {
            return userId.toString();
        }
        String email = UserContext.getUserEmail();
        return StringUtils.hasText(email) ? email : "system";
    }
}
