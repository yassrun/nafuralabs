package ma.nafura.platform.collaboration.workflow;

import ma.nafura.platform.collaboration.workflow.api.WorkflowStepDto;
import ma.nafura.platform.collaboration.workflow.api.WorkflowTemplateCreateRequest;
import ma.nafura.platform.collaboration.workflow.api.WorkflowTemplateDto;
import ma.nafura.platform.collaboration.workflow.api.WorkflowTemplateUpdateRequest;
import ma.nafura.platform.collaboration.workflow.domain.model.WorkflowStep;
import ma.nafura.platform.collaboration.workflow.domain.model.WorkflowTemplate;
import ma.nafura.platform.collaboration.workflow.repository.WorkflowInstanceRepository;
import ma.nafura.platform.collaboration.workflow.repository.WorkflowStepRepository;
import ma.nafura.platform.collaboration.workflow.repository.WorkflowTemplateRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.service.crud.CrudNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WorkflowTemplateService {

    private static final String STATUS_RUNNING = "RUNNING";

    private final WorkflowTemplateRepository templateRepository;
    private final WorkflowStepRepository stepRepository;
    private final WorkflowInstanceRepository instanceRepository;

    public Map<String, List<String>> getEntityTypes() {
        return Map.of("entityTypes", List.of(
                "Invoice", "Quote", "Receipt", "Order", "PurchaseOrder", "Contract", "Document"
        ));
    }

    public Page<WorkflowTemplateDto> list(Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        return templateRepository.findByTenantId(tenantId, pageable)
                .map(this::toDtoWithStepCount);
    }

    /**
     * List active workflow templates for an entity type (for entity detail "Submit for Approval").
     */
    public List<WorkflowTemplateDto> listByEntityType(String entityType) {
        UUID tenantId = TenantContext.getTenantId();
        List<WorkflowTemplate> templates = templateRepository
                .findByTenantIdAndEntityTypeAndIsActiveTrueOrderByNameAsc(tenantId, entityType);
        return templates.stream().map(this::toDtoWithStepCount).toList();
    }

    public WorkflowTemplateDto get(UUID id) {
        WorkflowTemplate template = templateRepository.findByIdAndTenantId(id, TenantContext.getTenantId())
                .orElseThrow(() -> new CrudNotFoundException("Workflow template not found: " + id));
        List<WorkflowStep> steps = stepRepository.findByWorkflowTemplateIdOrderByStepNumberAsc(id);
        return toDto(template, steps);
    }

    @Transactional
    public WorkflowTemplateDto create(WorkflowTemplateCreateRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        if (templateRepository.findByTenantIdAndEntityTypeAndCode(tenantId, request.getEntityType(), request.getCode()).isPresent()) {
            throw new IllegalArgumentException("Workflow template already exists with code: " + request.getCode());
        }
        WorkflowTemplate template = WorkflowTemplate.builder()
                .tenantId(tenantId)
                .code(request.getCode().trim())
                .name(request.getName().trim())
                .entityType(request.getEntityType().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
        template = templateRepository.save(template);
        saveSteps(template.getId(), tenantId, request.getSteps());
        return get(template.getId());
    }

    @Transactional
    public WorkflowTemplateDto update(UUID id, WorkflowTemplateUpdateRequest request) {
        WorkflowTemplate template = templateRepository.findByIdAndTenantId(id, TenantContext.getTenantId())
                .orElseThrow(() -> new CrudNotFoundException("Workflow template not found: " + id));
        UUID tenantId = TenantContext.getTenantId();
        template.setCode(request.getCode().trim());
        template.setName(request.getName().trim());
        template.setEntityType(request.getEntityType().trim());
        template.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        template.setIsActive(request.getIsActive());
        templateRepository.save(template);
        stepRepository.findByWorkflowTemplateIdOrderByStepNumberAsc(id).forEach(stepRepository::delete);
        saveSteps(id, tenantId, request.getSteps());
        return get(id);
    }

    @Transactional
    public void delete(UUID id) {
        WorkflowTemplate template = templateRepository.findByIdAndTenantId(id, TenantContext.getTenantId())
                .orElseThrow(() -> new CrudNotFoundException("Workflow template not found: " + id));
        long activeCount = instanceRepository.countByTemplateIdAndStatus(id, STATUS_RUNNING);
        if (activeCount > 0) {
            throw new IllegalStateException("Cannot delete template: " + activeCount + " active workflow instance(s) exist");
        }
        stepRepository.findByWorkflowTemplateIdOrderByStepNumberAsc(id).forEach(stepRepository::delete);
        templateRepository.delete(template);
    }

    @Transactional
    public WorkflowTemplateDto setActive(UUID id, boolean active) {
        WorkflowTemplate template = templateRepository.findByIdAndTenantId(id, TenantContext.getTenantId())
                .orElseThrow(() -> new CrudNotFoundException("Workflow template not found: " + id));
        template.setIsActive(active);
        templateRepository.save(template);
        return toDtoWithStepCount(template);
    }

    private void saveSteps(UUID templateId, UUID tenantId, List<WorkflowStepDto> stepDtos) {
        if (stepDtos == null || stepDtos.isEmpty()) return;
        List<WorkflowStep> steps = new ArrayList<>();
        for (int i = 0; i < stepDtos.size(); i++) {
            WorkflowStepDto dto = stepDtos.get(i);
            int stepNumber = dto.getStepNumber() != null ? dto.getStepNumber() : (i + 1);
            WorkflowStep step = WorkflowStep.builder()
                    .tenantId(tenantId)
                    .workflowTemplateId(templateId)
                    .stepNumber(stepNumber)
                    .name(dto.getName().trim())
                    .approverRole(dto.getApproverRole().trim())
                    .timeoutHours(dto.getTimeoutHours())
                    .escalationRole(dto.getEscalationRole() != null ? dto.getEscalationRole().trim() : null)
                    .condition(dto.getCondition() != null ? dto.getCondition().trim() : null)
                    .build();
            steps.add(stepRepository.save(step));
        }
    }

    private WorkflowTemplateDto toDtoWithStepCount(WorkflowTemplate template) {
        int stepCount = stepRepository.findByWorkflowTemplateIdOrderByStepNumberAsc(template.getId()).size();
        return WorkflowTemplateDto.builder()
                .id(template.getId())
                .code(template.getCode())
                .name(template.getName())
                .entityType(template.getEntityType())
                .description(template.getDescription())
                .isActive(template.getIsActive())
                .stepCount(stepCount)
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .build();
    }

    private WorkflowTemplateDto toDto(WorkflowTemplate template, List<WorkflowStep> steps) {
        List<WorkflowStepDto> stepDtos = steps.stream()
                .map(s -> WorkflowStepDto.builder()
                        .id(s.getId())
                        .stepNumber(s.getStepNumber())
                        .name(s.getName())
                        .approverRole(s.getApproverRole())
                        .timeoutHours(s.getTimeoutHours())
                        .escalationRole(s.getEscalationRole())
                        .condition(s.getCondition())
                        .build())
                .toList();
        return WorkflowTemplateDto.builder()
                .id(template.getId())
                .code(template.getCode())
                .name(template.getName())
                .entityType(template.getEntityType())
                .description(template.getDescription())
                .isActive(template.getIsActive())
                .stepCount(steps.size())
                .steps(stepDtos)
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .build();
    }
}
