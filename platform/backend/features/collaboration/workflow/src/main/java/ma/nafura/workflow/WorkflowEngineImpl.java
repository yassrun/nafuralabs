package ma.nafura.platform.collaboration.workflow;

import ma.nafura.platform.collaboration.workflow.domain.model.WorkflowInstance;
import ma.nafura.platform.collaboration.workflow.domain.model.WorkflowStep;
import ma.nafura.platform.collaboration.workflow.domain.model.WorkflowTemplate;
import ma.nafura.platform.collaboration.workflow.repository.WorkflowInstanceRepository;
import ma.nafura.platform.collaboration.workflow.repository.WorkflowStepRepository;
import ma.nafura.platform.collaboration.workflow.repository.WorkflowTemplateRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.platform.framework.service.crud.CrudNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WorkflowEngineImpl implements WorkflowEngine {

    private static final String STATUS_RUNNING = "RUNNING";
    private static final String STATUS_COMPLETED = "COMPLETED";
    private static final String STATUS_CANCELLED = "CANCELLED";

    private final WorkflowTemplateRepository templateRepository;
    private final WorkflowStepRepository stepRepository;
    private final WorkflowInstanceRepository instanceRepository;

    @Override
    @Transactional
    public WorkflowInstance trigger(String event, WorkflowContext context) {
        UUID tenantId = TenantContext.getTenantId();
        String templateCode = context.getTemplateCode() != null ? context.getTemplateCode() : event;
        WorkflowTemplate template = templateRepository.findByTenantIdAndEntityTypeAndCode(
                        tenantId, context.getEntityType(), templateCode)
                .orElse(null);
        if (template == null || Boolean.FALSE.equals(template.getIsActive())) {
            return null;
        }
        List<WorkflowStep> steps = stepRepository.findByWorkflowTemplateIdOrderByStepNumberAsc(template.getId());
        if (steps.isEmpty()) {
            return null;
        }
        WorkflowStep firstStep = steps.get(0);
        String initiatedBy = context.getInitiatedBy() != null ? context.getInitiatedBy() : UserContext.getUserEmail();
        if (initiatedBy == null) {
            initiatedBy = "system";
        }
        String instanceNumber = "WF-" + context.getEntityType() + "-" + context.getEntityId() + "-" + System.currentTimeMillis();
        WorkflowInstance instance = WorkflowInstance.builder()
                .tenantId(tenantId)
                .instanceNumber(instanceNumber)
                .templateId(template.getId())
                .entityType(context.getEntityType())
                .entityId(context.getEntityId())
                .currentStepId(firstStep.getId())
                .startedAt(OffsetDateTime.now())
                .initiatedBy(initiatedBy)
                .status(STATUS_RUNNING)
                .build();
        return instanceRepository.save(instance);
    }

    @Override
    @Transactional
    public void advance(UUID instanceId) {
        WorkflowInstance instance = instanceRepository.findByIdAndTenantId(instanceId, TenantContext.getTenantId())
                .orElseThrow(() -> new CrudNotFoundException("Workflow instance not found: " + instanceId));
        if (!STATUS_RUNNING.equals(instance.getStatus())) {
            return;
        }
        List<WorkflowStep> steps = stepRepository.findByWorkflowTemplateIdOrderByStepNumberAsc(instance.getTemplateId());
        int currentIndex = -1;
        for (int i = 0; i < steps.size(); i++) {
            if (steps.get(i).getId().equals(instance.getCurrentStepId())) {
                currentIndex = i;
                break;
            }
        }
        if (currentIndex >= 0 && currentIndex < steps.size() - 1) {
            instance.setCurrentStepId(steps.get(currentIndex + 1).getId());
            instanceRepository.save(instance);
        } else {
            complete(instanceId);
        }
    }

    @Override
    @Transactional
    public void complete(UUID instanceId) {
        WorkflowInstance instance = instanceRepository.findByIdAndTenantId(instanceId, TenantContext.getTenantId())
                .orElseThrow(() -> new CrudNotFoundException("Workflow instance not found: " + instanceId));
        instance.setStatus(STATUS_COMPLETED);
        instance.setCompletedAt(OffsetDateTime.now());
        instance.setCurrentStepId(null);
        instanceRepository.save(instance);
    }

    @Override
    @Transactional
    public void cancel(UUID instanceId) {
        WorkflowInstance instance = instanceRepository.findByIdAndTenantId(instanceId, TenantContext.getTenantId())
                .orElseThrow(() -> new CrudNotFoundException("Workflow instance not found: " + instanceId));
        instance.setStatus(STATUS_CANCELLED);
        instance.setCompletedAt(OffsetDateTime.now());
        instance.setCurrentStepId(null);
        instanceRepository.save(instance);
    }
}


