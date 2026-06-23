package ma.nafura.platform.collaboration.workflow;

import ma.nafura.platform.collaboration.workflow.api.ApprovalDashboardItem;
import ma.nafura.platform.collaboration.workflow.domain.model.ApprovalRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface ApprovalService {

    ApprovalRequest requestApproval(String entityType, UUID entityId, String title, List<ApprovalStepDefinition> workflow);

    Page<ApprovalRequest> listByEntity(String entityType, UUID entityId, Pageable pageable);

    List<ApprovalRequest> findPendingByEntity(String entityType, UUID entityId);

    void approve(UUID approvalRequestId, String comment);

    void reject(UUID approvalRequestId, String comment);

    /** Pending approval requests for the current user (where their role matches current step). FIFO. */
    List<ApprovalDashboardItem> getPendingForCurrentUser();

    /** Count of pending approvals for the current user. */
    long getPendingCountForCurrentUser();

    /** History of requests the current user has approved or rejected. Newest first. */
    List<ApprovalDashboardItem> getHistoryForCurrentUser();
}

