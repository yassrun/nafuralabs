package ma.nafura.erp.etudes;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.approbations.api.dto.ApprovalEtapeDto;
import ma.nafura.approbations.api.dto.ApprovalRequestDto;
import ma.nafura.approbations.api.request.ApprovalActionDto;
import ma.nafura.approbations.api.request.ApprovalRequestSubmitDto;
import ma.nafura.approbations.domain.model.ApprovalRequest;
import ma.nafura.approbations.repository.ErpApprovalRequestRepository;
import ma.nafura.approbations.service.ApprovalEngineService;
import ma.nafura.approbations.service.ApprovalWorkflowSeedService;
import ma.nafura.etudes.service.port.EtudeApprovalPort;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Branche le dossier d'étude sur le moteur d'approbations (workflow ETUDE_PRIX N+1/N+2).
 */
@Component
@Primary
public class EtudeApprovalAdapter implements EtudeApprovalPort {

    private static final List<String> OPEN =
            List.of(ApprovalRequest.STATUS_EN_COURS, ApprovalRequest.STATUS_EN_ATTENTE);

    private final ApprovalEngineService engine;
    private final ApprovalWorkflowSeedService workflowSeed;
    private final ErpApprovalRequestRepository requestRepository;

    public EtudeApprovalAdapter(
            ApprovalEngineService engine,
            ApprovalWorkflowSeedService workflowSeed,
            ErpApprovalRequestRepository requestRepository) {
        this.engine = engine;
        this.workflowSeed = workflowSeed;
        this.requestRepository = requestRepository;
    }

    @Override
    public boolean isAvailable() {
        return true;
    }

    @Override
    public ApprovalSnapshot soumettre(
            UUID dossierId,
            String numero,
            String resume,
            BigDecimal montantHt,
            String initiateurUserId,
            String initiateurNom) {
        workflowSeed.ensureEtudePrixWorkflow();
        // Matrice ETUDE_PRIX pour enrichissement / documentation du seuil
        // (sélection workflow via conditionsJson montant >= 500000).
        ApprovalRequestSubmitDto dto = new ApprovalRequestSubmitDto();
        dto.setEntityType(ENTITY_TYPE);
        dto.setEntityId(dossierId.toString());
        dto.setEntityRef(numero != null ? numero : dossierId.toString());
        dto.setEntitySummary(StringUtils.hasText(resume) ? resume : ("Étude " + numero));
        dto.setMontantConcerne(montantHt != null ? montantHt : BigDecimal.ZERO);
        dto.setInitiateurUserId(initiateurUserId);
        dto.setInitiateurNom(initiateurNom);
        return toSnapshot(engine.submit(dto));
    }

    @Override
    public ApprovalSnapshot approuverEtape(
            String requestId, String userId, String userNom, String commentaire) {
        ApprovalActionDto action = new ApprovalActionDto();
        action.setUserId(userId);
        action.setUserNom(userNom);
        action.setCommentaire(commentaire);
        return toSnapshot(engine.approve(requestId, action));
    }

    @Override
    public ApprovalSnapshot refuser(String requestId, String userId, String userNom, String motif) {
        ApprovalActionDto action = new ApprovalActionDto();
        action.setUserId(userId);
        action.setUserNom(userNom);
        action.setCommentaire(motif);
        return toSnapshot(engine.reject(requestId, action));
    }

    @Override
    public Optional<ApprovalSnapshot> trouverOuverte(UUID dossierId) {
        return requestRepository
                .findByTenantIdAndEntityTypeAndEntityIdAndStatusIn(
                        TenantContext.getTenantId(), ENTITY_TYPE, dossierId.toString(), OPEN)
                .map(r -> toSnapshot(engine.getRequest(r.getId())));
    }

    private ApprovalSnapshot toSnapshot(ApprovalRequestDto dto) {
        List<ApprovalEtapeDto> etapes = dto.getEtapes() != null ? dto.getEtapes() : List.of();
        int idx = dto.getEtapeCouranteIndex() != null ? dto.getEtapeCouranteIndex() : 0;
        String role = null;
        String nom = null;
        if (idx >= 0 && idx < etapes.size()) {
            ApprovalEtapeDto step = etapes.get(idx);
            role = step.getApprobateurRoleId();
            nom = step.getApprobateurNom();
        }
        return new ApprovalSnapshot(
                dto.getId(),
                dto.getStatus(),
                idx,
                etapes.size(),
                role,
                nom);
    }
}
