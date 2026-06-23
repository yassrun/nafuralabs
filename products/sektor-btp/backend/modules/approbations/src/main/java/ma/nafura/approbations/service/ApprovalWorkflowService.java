package ma.nafura.approbations.service;

import java.util.List;
import java.util.Locale;
import java.util.UUID;
import ma.nafura.approbations.api.request.ApprovalWorkflowCreateDto;
import ma.nafura.approbations.api.request.ApprovalWorkflowUpdateDto;
import ma.nafura.approbations.domain.model.ApprovalWorkflow;
import ma.nafura.approbations.repository.ApprovalWorkflowRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ApprovalWorkflowService {

    private final ApprovalWorkflowRepository repository;
    private final ApprovalWorkflowSeedService seedService;

    public ApprovalWorkflowService(ApprovalWorkflowRepository repository, ApprovalWorkflowSeedService seedService) {
        this.repository = repository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<ApprovalWorkflow> list(String entityType) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        if (StringUtils.hasText(entityType)) {
            return repository.findByTenantIdAndEntityTypeAndIsActiveTrueOrderByLabelAsc(
                    tenantId, entityType.trim().toUpperCase(Locale.ROOT));
        }
        return repository.findByTenantIdOrderByLabelAsc(tenantId);
    }

    @Transactional(readOnly = true)
    public ApprovalWorkflow getById(String id) {
        seedService.seedIfEmpty();
        return repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Workflow not found: " + id));
    }

    @Transactional
    public ApprovalWorkflow create(ApprovalWorkflowCreateDto dto) {
        UUID tenantId = tenantId();
        String id = StringUtils.hasText(dto.getId()) ? dto.getId().trim() : dto.getCode().trim();
        if (repository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("Workflow id already exists: " + id);
        }
        ApprovalWorkflow entity = ApprovalWorkflow.builder()
                .id(id)
                .tenantId(tenantId)
                .code(dto.getCode().trim())
                .label(dto.getLabel().trim())
                .entityType(dto.getEntityType().trim().toUpperCase(Locale.ROOT))
                .conditionsJson(dto.getConditionsJson())
                .etapesJson(dto.getEtapesJson())
                .slaJours(dto.getSlaJours())
                .escaladeApresJours(dto.getEscaladeApresJours())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : Boolean.TRUE)
                .build();
        return repository.save(entity);
    }

    @Transactional
    public ApprovalWorkflow update(String id, ApprovalWorkflowUpdateDto dto) {
        ApprovalWorkflow entity = getById(id);
        if (dto.getCode() != null) {
            entity.setCode(dto.getCode().trim());
        }
        if (dto.getLabel() != null) {
            entity.setLabel(dto.getLabel().trim());
        }
        if (dto.getEntityType() != null) {
            entity.setEntityType(dto.getEntityType().trim().toUpperCase(Locale.ROOT));
        }
        if (dto.getConditionsJson() != null) {
            entity.setConditionsJson(dto.getConditionsJson());
        }
        if (dto.getEtapesJson() != null) {
            entity.setEtapesJson(dto.getEtapesJson());
        }
        if (dto.getSlaJours() != null) {
            entity.setSlaJours(dto.getSlaJours());
        }
        if (dto.getEscaladeApresJours() != null) {
            entity.setEscaladeApresJours(dto.getEscaladeApresJours());
        }
        if (dto.getIsActive() != null) {
            entity.setIsActive(dto.getIsActive());
        }
        return repository.save(entity);
    }

    @Transactional
    public void delete(String id) {
        ApprovalWorkflow entity = getById(id);
        repository.delete(entity);
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
