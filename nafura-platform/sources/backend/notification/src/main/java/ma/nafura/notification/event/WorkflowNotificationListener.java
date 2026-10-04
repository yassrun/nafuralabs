package ma.nafura.platform.collaboration.notification.event;

import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.collaboration.notification.service.NotificationRouter;
import ma.nafura.platform.collaboration.notification.service.NotificationRouter.Message;
import ma.nafura.platform.collaboration.workflow.domain.model.ApprovalRequest;
import ma.nafura.platform.collaboration.workflow.domain.model.ApprovalStep;
import ma.nafura.platform.collaboration.workflow.repository.ApprovalRequestRepository;
import ma.nafura.platform.collaboration.workflow.repository.ApprovalStepRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.record.LifecycleEngine;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.repository.AppUserRepository;
import ma.nafura.platform.collaboration.workflow.event.ApprovalStateChangedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Approvals: the pending approvers are told ({@code platform.approval.requested}); the requester learns the
 * decision ({@code platform.approval.decided}) unless the record has a lifecycle, whose outcome transition
 * carries its own {@code notify}.
 */
@Component
@RequiredArgsConstructor
public class WorkflowNotificationListener {

    private final NotificationRouter router;
    private final ApprovalRequestRepository approvalRequestRepository;
    private final ApprovalStepRepository approvalStepRepository;
    private final AppUserRepository appUserRepository;
    private final LifecycleEngine lifecycles;

    @EventListener
    public void onApprovalStateChanged(ApprovalStateChangedEvent event) {
        ApprovalRequest request = approvalRequestRepository
                .findByIdAndTenantId(event.getApprovalRequestId(), event.getTenantId())
                .orElse(null);
        if (request == null) {
            return;
        }
        switch (event.getNewStatus()) {
            case "PENDING" -> notifyApprovers(event, request);
            case "APPROVED" -> notifyRequester(event, request, "approuvée");
            case "REJECTED" -> notifyRequester(event, request, "rejetée");
            default -> {
            }
        }
    }

    private void notifyApprovers(ApprovalStateChangedEvent event, ApprovalRequest request) {
        Set<UUID> approverIds = new LinkedHashSet<>();
        for (ApprovalStep step : approvalStepRepository.findByApprovalRequestIdOrderByStepNumberAsc(event.getApprovalRequestId())) {
            if ("PENDING".equalsIgnoreCase(step.getStatus()) && step.getApproverId() != null) {
                approverIds.add(step.getApproverId());
            }
        }
        withTenant(event.getTenantId(), () -> approverIds.forEach(approverId ->
                router.send(Message.of("platform.approval.requested", approverId, Map.of("title", title(request, event)))
                        .about(event.getEntityType(), event.getEntityId())
                        .link("/approvals"))));
    }

    private void notifyRequester(ApprovalStateChangedEvent event, ApprovalRequest request, String outcome) {
        if (lifecycles.lifecycleOf(event.getEntityType()).isPresent()) {
            return;
        }
        if (request.getRequestedBy() == null || request.getRequestedBy().isBlank()) {
            return;
        }
        AppUser requester = appUserRepository.findByEmailIgnoreCase(request.getRequestedBy()).orElse(null);
        if (requester == null) {
            return;
        }
        withTenant(event.getTenantId(), () ->
                router.send(Message.of("platform.approval.decided", requester.getId(),
                                Map.of("title", title(request, event), "outcome", outcome))
                        .about(event.getEntityType(), event.getEntityId())
                        .link("/approvals")));
    }

    private static String title(ApprovalRequest request, ApprovalStateChangedEvent event) {
        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            return request.getTitle();
        }
        String entityType = event.getEntityType();
        return entityType == null || entityType.isBlank() ? "Demande" : entityType.replace('-', ' ').replace('_', ' ');
    }

    private void withTenant(UUID tenantId, Runnable work) {
        UUID previous = TenantContext.getTenantIdOrNull();
        try {
            TenantContext.setTenantId(tenantId);
            work.run();
        } finally {
            if (previous != null) {
                TenantContext.setTenantId(previous);
            } else {
                TenantContext.clear();
            }
        }
    }
}
