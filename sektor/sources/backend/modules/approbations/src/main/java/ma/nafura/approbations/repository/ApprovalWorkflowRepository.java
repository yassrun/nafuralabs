package ma.nafura.approbations.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.approbations.domain.model.ApprovalWorkflow;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ApprovalWorkflowRepository extends TenantScopedRepository<ApprovalWorkflow, String> {

    List<ApprovalWorkflow> findByTenantIdOrderByLabelAsc(UUID tenantId);

    List<ApprovalWorkflow> findByTenantIdAndEntityTypeAndIsActiveTrueOrderByLabelAsc(
            UUID tenantId, String entityType);

    long countByTenantId(UUID tenantId);
}
