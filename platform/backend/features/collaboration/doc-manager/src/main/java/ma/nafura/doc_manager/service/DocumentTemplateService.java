package ma.nafura.platform.collaboration.docmanager.service;

import ma.nafura.platform.collaboration.docmanager.api.request.DocumentTemplateCreateRequest;
import ma.nafura.platform.collaboration.docmanager.api.request.DocumentTemplateUpdateRequest;
import ma.nafura.platform.collaboration.docmanager.domain.model.DocumentTemplate;
import ma.nafura.platform.collaboration.docmanager.repository.DocumentTemplateRepository;
import ma.nafura.platform.collaboration.docmanager.template.DocumentTemplateBootstrap;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class DocumentTemplateService {

    private final DocumentTemplateRepository repository;
    private final List<DocumentTemplateBootstrap> bootstraps;

    public DocumentTemplateService(
            DocumentTemplateRepository repository,
            List<DocumentTemplateBootstrap> bootstraps) {
        this.repository = repository;
        this.bootstraps = bootstraps != null ? bootstraps : List.of();
    }

    public Page<DocumentTemplate> list(String entityType, Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        ensureDefaults(tenantId);
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
        DocumentTemplate source = null;
        if (request.getCloneFromId() != null) {
            source = repository
                    .findByIdAndTenantId(request.getCloneFromId(), tenantId)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Clone source template not found: " + request.getCloneFromId()));
        }

        String body = request.getTemplateBody();
        if ((body == null || body.isBlank()) && source != null) {
            body = source.getTemplateBody();
        }
        if (body == null || body.isBlank()) {
            body = "<div></div>";
        }

        DocumentTemplate t = DocumentTemplate.builder()
                .tenantId(tenantId)
                .code(request.getCode())
                .name(request.getName())
                .entityType(
                        request.getEntityType() != null && !request.getEntityType().isBlank()
                                ? request.getEntityType()
                                : (source != null ? source.getEntityType() : request.getEntityType()))
                .format(request.getFormat() != null && !request.getFormat().isBlank()
                        ? request.getFormat()
                        : (source != null && source.getFormat() != null ? source.getFormat() : "pdf"))
                .templateBody(body)
                .isSystem(false)
                .paperSize(firstNonBlank(request.getPaperSize(), source != null ? source.getPaperSize() : null, "A4"))
                .orientation(firstNonBlank(
                        request.getOrientation(), source != null ? source.getOrientation() : null, "portrait"))
                .marginsCss(firstNonBlank(
                        request.getMarginsCss(), source != null ? source.getMarginsCss() : null, null))
                .metadata(firstNonBlank(request.getMetadata(), source != null ? source.getMetadata() : null, null))
                .isDefault(request.getIsDefault() != null ? request.getIsDefault() : false)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
        return repository.save(t);
    }

    private static String firstNonBlank(String primary, String fallback, String defaultValue) {
        if (primary != null && !primary.isBlank()) {
            return primary;
        }
        if (fallback != null && !fallback.isBlank()) {
            return fallback;
        }
        return defaultValue;
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

    private void ensureDefaults(UUID tenantId) {
        for (DocumentTemplateBootstrap bootstrap : bootstraps) {
            bootstrap.ensureDefaults(tenantId);
        }
    }
}
