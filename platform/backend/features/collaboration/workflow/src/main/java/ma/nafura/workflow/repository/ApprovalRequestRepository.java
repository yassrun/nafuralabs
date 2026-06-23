package ma.nafura.platform.collaboration.workflow.repository;

import ma.nafura.platform.collaboration.workflow.domain.model.ApprovalRequest;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface ApprovalRequestRepository extends TenantScopedRepository<ApprovalRequest, UUID> {

    Page<ApprovalRequest> findByTenantIdAndEntityTypeAndEntityIdOrderByRequestedAtDesc(
            UUID tenantId, String entityType, UUID entityId, Pageable pageable);

    List<ApprovalRequest> findByTenantIdAndEntityTypeAndEntityId(
            UUID tenantId, String entityType, UUID entityId);

    /** For "my pending" dashboard: requests whose current step matches user role. */
    List<ApprovalRequest> findByTenantIdAndIdInOrderByRequestedAtAsc(
            UUID tenantId, Collection<UUID> ids);

    /** For "my history" dashboard: requests the current user approved or rejected. */
    List<ApprovalRequest> findByTenantIdAndApprovedByOrderByApprovedAtDesc(
            UUID tenantId, String approvedBy);
}


