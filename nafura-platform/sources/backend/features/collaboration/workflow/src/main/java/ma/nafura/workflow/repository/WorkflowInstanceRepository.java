package ma.nafura.platform.collaboration.workflow.repository;

import ma.nafura.platform.collaboration.workflow.domain.model.WorkflowInstance;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface WorkflowInstanceRepository extends TenantScopedRepository<WorkflowInstance, UUID> {

    long countByTemplateIdAndStatus(UUID templateId, String status);
}


