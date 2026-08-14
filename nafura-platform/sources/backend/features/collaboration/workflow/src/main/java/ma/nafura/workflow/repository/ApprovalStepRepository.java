package ma.nafura.platform.collaboration.workflow.repository;

import ma.nafura.platform.collaboration.workflow.domain.model.ApprovalStep;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ApprovalStepRepository extends TenantScopedRepository<ApprovalStep, UUID> {

    List<ApprovalStep> findByApprovalRequestIdOrderByStepNumberAsc(UUID approvalRequestId);

    /** Pending steps where current user's role can approve (for "my pending" dashboard). */
    List<ApprovalStep> findByTenantIdAndStatusAndApproverRole(
            UUID tenantId, String status, String approverRole);
}


