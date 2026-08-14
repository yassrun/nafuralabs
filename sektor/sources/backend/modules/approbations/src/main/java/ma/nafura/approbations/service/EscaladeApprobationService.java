package ma.nafura.approbations.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import ma.nafura.approbations.domain.model.ApprovalRequest;
import ma.nafura.approbations.domain.model.ApprovalWorkflow;
import ma.nafura.approbations.repository.ErpApprovalRequestRepository;
import ma.nafura.approbations.repository.ApprovalWorkflowRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class EscaladeApprobationService {

    private static final Logger log = LoggerFactory.getLogger(EscaladeApprobationService.class);

    private final ErpApprovalRequestRepository requestRepository;
    private final ApprovalWorkflowRepository workflowRepository;

    public EscaladeApprobationService(
            ErpApprovalRequestRepository requestRepository,
            ApprovalWorkflowRepository workflowRepository) {
        this.requestRepository = requestRepository;
        this.workflowRepository = workflowRepository;
    }

    /** Daily stub: logs EN_COURS requests past workflow escalade_apres_jours. */
    @Scheduled(cron = "0 0 1 * * ?")
    public void escalateOverdueRequests() {
        if (!TenantContext.isTenantEnabled() || TenantContext.getTenantIdOrNull() == null) {
            return;
        }
        UUID tenantId = TenantContext.getTenantId();
        LocalDate today = LocalDate.now();
        List<ApprovalRequest> overdue = findOverdueRequests(tenantId, today);
        for (ApprovalRequest request : overdue) {
            log.info(
                    "SLA escalation candidate: requestId={}, entityType={}, entityId={}, etapeIndex={}",
                    request.getId(),
                    request.getEntityType(),
                    request.getEntityId(),
                    request.getEtapeCouranteIndex());
        }
    }

    List<ApprovalRequest> findOverdueRequests(UUID tenantId, LocalDate today) {
        List<ApprovalRequest> inProgress = requestRepository
                .findByTenantIdAndStatusInOrderByDateSoumissionDescCreatedAtDesc(
                        tenantId,
                        List.of(ApprovalRequest.STATUS_EN_COURS, ApprovalRequest.STATUS_EN_ATTENTE));
        List<ApprovalRequest> overdue = new ArrayList<>();
        for (ApprovalRequest request : inProgress) {
            workflowRepository.findByIdAndTenantId(request.getWorkflowId(), tenantId).ifPresent(workflow -> {
                if (isPastEscaladeThreshold(request, workflow, today)) {
                    overdue.add(request);
                }
            });
        }
        return overdue;
    }

    static boolean isPastEscaladeThreshold(ApprovalRequest request, ApprovalWorkflow workflow, LocalDate today) {
        Integer escaladeApresJours = workflow.getEscaladeApresJours();
        if (escaladeApresJours == null || escaladeApresJours <= 0) {
            return false;
        }
        LocalDate dateSoumission = request.getDateSoumission();
        if (dateSoumission == null) {
            return false;
        }
        LocalDate escaladeDate = dateSoumission.plusDays(escaladeApresJours);
        return today.isAfter(escaladeDate);
    }
}
