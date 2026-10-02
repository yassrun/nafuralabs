package ma.nafura.platform.collaboration.workflow;

import java.util.List;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.collaboration.workflow.event.ApprovalStateChangedEvent;
import ma.nafura.platform.framework.record.ApprovalGateway;
import ma.nafura.platform.framework.record.LifecycleEngine;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/** Approvals of record lifecycles: a transition opens a request, its decision fires the outcome transition. */
@Component
@RequiredArgsConstructor
public class LifecycleApprovals implements ApprovalGateway {

    private final ApprovalService approvals;
    private final LifecycleEngine lifecycles;

    @Override
    public void request(String entityType, UUID entityId, String title, String approverRole) {
        approvals.requestApproval(entityType, entityId, title,
                List.of(ApprovalStepDefinition.builder().stepNumber(1).approverRole(approverRole).build()));
    }

    @EventListener
    public void onDecision(ApprovalStateChangedEvent event) {
        switch (event.getNewStatus()) {
            case "APPROVED" -> lifecycles.onApprovalDecided(event.getEntityType(), event.getEntityId(), true);
            case "REJECTED" -> lifecycles.onApprovalDecided(event.getEntityType(), event.getEntityId(), false);
            default -> { }
        }
    }
}
