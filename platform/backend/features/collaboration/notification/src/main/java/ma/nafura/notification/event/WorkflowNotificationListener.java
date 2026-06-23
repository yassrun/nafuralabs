package ma.nafura.platform.collaboration.notification.event;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.collaboration.notification.service.NotificationCreationService;
import ma.nafura.platform.collaboration.workflow.domain.model.ApprovalRequest;
import ma.nafura.platform.collaboration.workflow.domain.model.ApprovalStep;
import ma.nafura.platform.collaboration.workflow.repository.ApprovalRequestRepository;
import ma.nafura.platform.collaboration.workflow.repository.ApprovalStepRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.repository.AppUserRepository;
import ma.nafura.platform.collaboration.workflow.event.ApprovalStateChangedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class WorkflowNotificationListener {

    private final NotificationCreationService notificationCreationService;
    private final ApprovalRequestRepository approvalRequestRepository;
    private final ApprovalStepRepository approvalStepRepository;
    private final AppUserRepository appUserRepository;

    @EventListener
    public void onApprovalStateChanged(ApprovalStateChangedEvent event) {
        switch (event.getNewStatus()) {
            case "PENDING" -> notifyApprovers(event);
            case "APPROVED" -> notifyInitiator(event, "approved");
            case "REJECTED" -> notifyInitiator(event, "rejected");
            default -> {
            }
        }
    }

    private void notifyApprovers(ApprovalStateChangedEvent event) {
        Set<UUID> approverIds = new LinkedHashSet<>();
        for (ApprovalStep step : approvalStepRepository.findByApprovalRequestIdOrderByStepNumberAsc(event.getApprovalRequestId())) {
            if ("PENDING".equalsIgnoreCase(step.getStatus()) && step.getApproverId() != null) {
                approverIds.add(step.getApproverId());
            }
        }

        for (UUID approverId : approverIds) {
            AppUser approver = appUserRepository.findById(approverId).orElse(null);
            if (approver == null || approver.getEmail() == null || approver.getEmail().isBlank()) {
                continue;
            }
            withTenant(event.getTenantId(), () -> {
                NotificationEvent notificationEvent = NotificationEvent.builder()
                        .sourceObject(this)
                        .recipientId(approverId)
                        .title("Approval requested")
                        .body(String.format("%s requires your approval.", readableEntity(event.getEntityType())))
                        .entityType(event.getEntityType())
                        .entityId(event.getEntityId())
                        .source("workflow")
                        .actionUrl("/approvals")
                        .build();
                notificationCreationService.createAndDeliver(notificationEvent, approver.getEmail());
            });
        }
    }

    private void notifyInitiator(ApprovalStateChangedEvent event, String outcome) {
        ApprovalRequest request = approvalRequestRepository
                .findByIdAndTenantId(event.getApprovalRequestId(), event.getTenantId())
                .orElse(null);

        if (request == null || request.getRequestedBy() == null || request.getRequestedBy().isBlank()) {
            return;
        }

        AppUser initiator = appUserRepository.findByEmailIgnoreCase(request.getRequestedBy()).orElse(null);
        if (initiator == null) {
            return;
        }

        withTenant(event.getTenantId(), () -> {
            NotificationEvent notificationEvent = NotificationEvent.builder()
                    .sourceObject(this)
                    .recipientId(initiator.getId())
                    .title("Approval update")
                    .body(String.format(
                            "%s was %s.",
                            readableEntity(event.getEntityType()),
                            outcome
                    ))
                    .entityType(event.getEntityType())
                    .entityId(event.getEntityId())
                    .source("workflow")
                    .actionUrl("/approvals")
                    .build();
            notificationCreationService.createAndDeliver(notificationEvent, initiator.getEmail());
        });
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

    private String readableEntity(String entityType) {
        if (entityType == null || entityType.isBlank()) {
            return "Request";
        }
        String value = entityType.replace('-', ' ').replace('_', ' ').trim();
        return Character.toUpperCase(value.charAt(0)) + value.substring(1);
    }
}
