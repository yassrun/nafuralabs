package ma.nafura.platform.collaboration.workflow.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.collaboration.workflow.domain.model.WorkflowTemplate;
import ma.nafura.platform.framework.record.RecordRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkflowTemplateRepository extends RecordRepository<WorkflowTemplate> {

    Optional<WorkflowTemplate> findByIdAndTenantId(UUID id, UUID tenantId);

    Page<WorkflowTemplate> findByTenantId(UUID tenantId, Pageable pageable);

    Optional<WorkflowTemplate> findByTenantIdAndEntityTypeAndCode(UUID tenantId, String entityType, String code);

    List<WorkflowTemplate> findByTenantIdAndEntityTypeAndIsActiveTrueOrderByNameAsc(UUID tenantId, String entityType);
}
