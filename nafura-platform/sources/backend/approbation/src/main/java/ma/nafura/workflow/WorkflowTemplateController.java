package ma.nafura.platform.collaboration.workflow;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.collaboration.workflow.domain.model.WorkflowTemplate;
import ma.nafura.platform.collaboration.workflow.repository.WorkflowInstanceRepository;
import ma.nafura.platform.collaboration.workflow.repository.WorkflowTemplateRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.record.RecordController;
import ma.nafura.platform.framework.record.RecordRepository;
import ma.nafura.platform.framework.record.RecordRuleException;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Approval workflow templates of the organization, a record, plus entity-type metadata.
 * Permissions: administration.approvals.workflows.{read,create,update,delete}.
 */
@RestController
@RequestMapping("/api/v1/platform/collaboration/workflow/templates")
@SecuredResource(domain = "administration", feature = "approvals", resource = "workflows")
public class WorkflowTemplateController extends RecordController<WorkflowTemplate> {

    private static final String STATUS_RUNNING = "RUNNING";

    private final WorkflowTemplateRepository repository;
    private final WorkflowTemplateService templates;
    private final WorkflowInstanceRepository instances;

    public WorkflowTemplateController(
            WorkflowTemplateRepository repository,
            WorkflowTemplateService templates,
            WorkflowInstanceRepository instances) {
        this.repository = repository;
        this.templates = templates;
        this.instances = instances;
    }

    @Override
    protected RecordRepository<WorkflowTemplate> repository() {
        return repository;
    }

    @Override
    protected String recordResource() {
        return "records/workflow-template.json";
    }

    @Override
    protected String labelField() {
        return "name";
    }

    @Override
    protected Sort defaultSort() {
        return Sort.by(Sort.Direction.DESC, "updatedAt");
    }

    @Override
    protected Set<String> readOnlyFields() {
        return Set.of("stepCount");
    }

    @Override
    protected Map<String, String> validate(WorkflowTemplate template, WorkflowTemplate previous) {
        UUID tenantId = TenantContext.getTenantId();
        String code = template.getCode() == null ? "" : template.getCode().trim();
        String entityType = template.getEntityType() == null ? "" : template.getEntityType().trim();
        var existing = repository.findByTenantIdAndEntityTypeAndCode(tenantId, entityType, code);
        if (existing.isPresent() && (previous == null || !existing.get().getId().equals(previous.getId()))) {
            return Map.of("code", "Ce code existe déjà pour ce type d'entité");
        }
        return Map.of();
    }

    @Override
    protected void beforeSave(WorkflowTemplate template, WorkflowTemplate previous) {
        templates.prepareSave(template, previous);
    }

    @Override
    protected void beforeDelete(WorkflowTemplate template) {
        long activeCount = instances.countByTemplateIdAndStatus(template.getId(), STATUS_RUNNING);
        if (activeCount > 0) {
            throw RecordRuleException.refused(
                    "Cannot delete template: " + activeCount + " active workflow instance(s) exist");
        }
    }

    @GetMapping("/entity-types")
    @RequirePermission("read")
    public Map<String, List<String>> getEntityTypes() {
        return templates.getEntityTypes();
    }

    @PostMapping("/{id}/activate")
    @RequirePermission("update")
    @Transactional
    public WorkflowTemplate activate(@PathVariable UUID id) {
        return setActive(id, true);
    }

    @PostMapping("/{id}/deactivate")
    @RequirePermission("update")
    @Transactional
    public WorkflowTemplate deactivate(@PathVariable UUID id) {
        return setActive(id, false);
    }

    private WorkflowTemplate setActive(UUID id, boolean active) {
        WorkflowTemplate template = find(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Workflow template not found"));
        template.setIsActive(active);
        return repository.save(template);
    }
}
