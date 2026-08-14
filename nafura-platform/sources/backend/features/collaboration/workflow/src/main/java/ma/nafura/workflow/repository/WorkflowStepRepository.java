package ma.nafura.platform.collaboration.workflow.repository;

import ma.nafura.platform.collaboration.workflow.domain.model.WorkflowStep;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkflowStepRepository extends TenantScopedRepository<WorkflowStep, UUID> {

    List<WorkflowStep> findByWorkflowTemplateIdOrderByStepNumberAsc(UUID workflowTemplateId);
}


