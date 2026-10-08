package ma.nafura.platform.collaboration.workflow.repository;

import ma.nafura.platform.collaboration.workflow.domain.model.ApprovalStep;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ApprovalStepRepository extends TenantScopedRepository<ApprovalStep, UUID> {

    List<ApprovalStep> findByApprovalRequestIdOrderByStepNumberAsc(UUID approvalRequestId);

    /** Pending steps in the organisation (filtered in memory by the caller's permissions). */
    List<ApprovalStep> findByTenantIdAndStatus(UUID tenantId, String status);
}
