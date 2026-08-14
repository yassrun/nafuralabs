package ma.nafura.platform.collaboration.workflow.repository;

import ma.nafura.platform.collaboration.workflow.domain.model.WorkflowTemplate;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkflowTemplateRepository extends TenantScopedRepository<WorkflowTemplate, UUID> {

    Optional<WorkflowTemplate> findByTenantIdAndEntityTypeAndCode(UUID tenantId, String entityType, String code);

    List<WorkflowTemplate> findByTenantIdAndEntityTypeAndIsActiveTrueOrderByNameAsc(UUID tenantId, String entityType);
}


