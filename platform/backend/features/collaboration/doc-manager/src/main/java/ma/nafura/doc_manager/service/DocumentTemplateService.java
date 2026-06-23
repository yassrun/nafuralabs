package ma.nafura.platform.collaboration.docmanager.service;

import ma.nafura.platform.collaboration.docmanager.api.request.DocumentTemplateCreateRequest;
import ma.nafura.platform.collaboration.docmanager.api.request.DocumentTemplateUpdateRequest;
import ma.nafura.platform.collaboration.docmanager.domain.model.DocumentTemplate;
import ma.nafura.platform.collaboration.docmanager.repository.DocumentTemplateRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class DocumentTemplateService {

    private final DocumentTemplateRepository repository;

    public DocumentTemplateService(DocumentTemplateRepository repository) {
        this.repository = repository;
    }

    public Page<DocumentTemplate> list(String entityType, Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        if (entityType != null && !entityType.isBlank()) {
            return repository.findByTenantIdAndEntityType(tenantId, entityType, pageable);
        }
        return repository.findByTenantId(tenantId, pageable);
    }

    public DocumentTemplate get(UUID id) {
        return repository.findByIdAndTenantId(id, TenantContext.getTenantId())
                .orElseThrow(() -> new IllegalArgumentException("Template not found: " + id));
    }

    @Transactional
    public DocumentTemplate create(DocumentTemplateCreateRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        DocumentTemplate t = DocumentTemplate.builder()
                .tenantId(tenantId)
                .code(request.getCode())
                .name(request.getName())
                .entityType(request.getEntityType())
                .format(request.getFormat() != null ? request.getFormat() : "pdf")
                .templateBody(request.getTemplateBody())
                .isSystem(false)
                .paperSize(request.getPaperSize())
                .orientation(request.getOrientation())
                .marginsCss(request.getMarginsCss())
                .metadata(request.getMetadata())
                .isDefault(request.getIsDefault())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
        return repository.save(t);
    }

    @Transactional
    public DocumentTemplate update(UUID id, DocumentTemplateUpdateRequest request) {
        DocumentTemplate t = get(id);
        if (Boolean.TRUE.equals(t.getIsSystem())) {
            throw new IllegalArgumentException("System templates cannot be updated");
        }
        if (request.getCode() != null) t.setCode(request.getCode());
        if (request.getName() != null) t.setName(request.getName());
        if (request.getEntityType() != null) t.setEntityType(request.getEntityType());
        if (request.getFormat() != null) t.setFormat(request.getFormat());
        if (request.getTemplateBody() != null) t.setTemplateBody(request.getTemplateBody());
        if (request.getPaperSize() != null) t.setPaperSize(request.getPaperSize());
        if (request.getOrientation() != null) t.setOrientation(request.getOrientation());
        if (request.getMarginsCss() != null) t.setMarginsCss(request.getMarginsCss());
        if (request.getMetadata() != null) t.setMetadata(request.getMetadata());
        if (request.getIsDefault() != null) t.setIsDefault(request.getIsDefault());
        if (request.getIsActive() != null) t.setIsActive(request.getIsActive());
        return repository.save(t);
    }

    @Transactional
    public void delete(UUID id) {
        DocumentTemplate t = get(id);
        if (Boolean.TRUE.equals(t.getIsSystem())) {
            throw new IllegalArgumentException("System templates cannot be deleted");
        }
        repository.delete(t);
    }
}
