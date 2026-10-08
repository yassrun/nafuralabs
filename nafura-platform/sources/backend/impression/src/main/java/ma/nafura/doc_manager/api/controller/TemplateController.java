package ma.nafura.platform.collaboration.docmanager.api.controller;

import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.collaboration.docmanager.api.request.TemplatePreviewRequest;
import ma.nafura.platform.collaboration.docmanager.api.request.TemplateRenderRequest;
import ma.nafura.platform.collaboration.docmanager.api.response.TemplateRenderError;
import ma.nafura.platform.collaboration.docmanager.api.response.TemplateVariableCatalogResponse;
import ma.nafura.platform.collaboration.docmanager.domain.model.DocumentTemplate;
import ma.nafura.platform.collaboration.docmanager.repository.DocumentTemplateRepository;
import ma.nafura.platform.collaboration.docmanager.service.DocumentTemplateService;
import ma.nafura.platform.collaboration.docmanager.template.EntityDataProvider;
import ma.nafura.platform.collaboration.docmanager.template.PrintEntityTypeDescriptor;
import ma.nafura.platform.collaboration.docmanager.template.SampleRecord;
import ma.nafura.platform.collaboration.docmanager.template.TemplateBodyValidator;
import ma.nafura.platform.collaboration.docmanager.template.TemplateRenderException;
import ma.nafura.platform.collaboration.docmanager.template.TemplateRenderService;
import ma.nafura.platform.collaboration.docmanager.template.TemplateVariableCatalogService;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.platform.framework.record.RecordController;
import ma.nafura.platform.framework.record.RecordRepository;
import ma.nafura.platform.framework.record.RecordRuleException;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Print templates of the organization, a record. Permissions:
 * {@code administration.documents.templates.{read,create,update,delete}}; editing the raw body needs
 * {@code administration.documents.templates.editBody}.
 */
@RestController
@RequestMapping("/api/v1/platform/templates")
@SecuredResource(domain = "administration", feature = "documents", resource = "templates")
@RequiredArgsConstructor
public class TemplateController extends RecordController<DocumentTemplate> {

    private static final int SAMPLE_RECORD_LIMIT = 20;

    private static final String EDIT_BODY_PERMISSION = "administration.documents.templates.editBody";

    private final DocumentTemplateRepository repository;
    private final DocumentTemplateService templateService;
    private final TemplateRenderService renderService;
    private final TemplateVariableCatalogService variableCatalogService;
    private final List<EntityDataProvider> entityDataProviders;

    @Override
    protected RecordRepository<DocumentTemplate> repository() {
        return repository;
    }

    @Override
    protected String recordResource() {
        return "records/document-template.json";
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
        return Set.of("isSystem", "typeLabel");
    }

    @Override
    protected void beforeQuery(Map<String, String> params) {
        templateService.ensureDefaultsForCurrentTenant();
    }

    @Override
    protected Map<String, String> validate(DocumentTemplate record, DocumentTemplate previous) {
        UUID tenantId = TenantContext.getTenantId();
        String code = record.getCode() == null ? "" : record.getCode().trim();
        if (code.isEmpty()) {
            return Map.of("code", "Le code est requis");
        }
        boolean taken = previous == null
                ? repository.existsByTenantIdAndCode(tenantId, code)
                : repository.existsByTenantIdAndCodeAndIdNot(tenantId, code, previous.getId());
        if (taken) {
            return Map.of("code", "Ce code existe déjà");
        }
        if (previous != null && Boolean.TRUE.equals(previous.getIsSystem())) {
            return Map.of("code", "Les modèles système ne peuvent pas être modifiés");
        }
        return Map.of();
    }

    @Override
    protected void beforeSave(DocumentTemplate record, DocumentTemplate previous) {
        UUID tenantId = TenantContext.getTenantId();
        if (record.getCode() != null) {
            record.setCode(record.getCode().trim());
        }
        if (record.getName() != null) {
            record.setName(record.getName().trim());
        }
        if (previous != null) {
            if (record.getTemplateBody() != null
                    && !Objects.equals(record.getTemplateBody(), previous.getTemplateBody())) {
                requireBodyEditPermission();
                TemplateBodyValidator.validate(record.getTemplateBody());
            }
            return;
        }

        DocumentTemplate source = null;
        if (record.getCloneFromId() != null) {
            source = repository
                    .findByIdAndTenantId(record.getCloneFromId(), tenantId)
                    .orElseThrow(() -> RecordRuleException.refused("Modèle source introuvable"));
        }

        String body = record.getTemplateBody();
        if ((body == null || body.isBlank()) && source != null) {
            body = source.getTemplateBody();
        }
        if (body == null || body.isBlank()) {
            body = "<div></div>";
        }
        TemplateBodyValidator.validate(body);
        record.setTemplateBody(body);

        if (record.getEntityType() == null || record.getEntityType().isBlank()) {
            if (source != null) {
                record.setEntityType(source.getEntityType());
            }
        }
        if (record.getFormat() == null || record.getFormat().isBlank()) {
            record.setFormat(source != null && source.getFormat() != null ? source.getFormat() : "pdf");
        }
        if (record.getPaperSize() == null || record.getPaperSize().isBlank()) {
            record.setPaperSize(firstNonBlank(null, source != null ? source.getPaperSize() : null, "A4"));
        }
        if (record.getOrientation() == null || record.getOrientation().isBlank()) {
            record.setOrientation(firstNonBlank(null, source != null ? source.getOrientation() : null, "portrait"));
        }
        if (record.getMarginsCss() == null && source != null) {
            record.setMarginsCss(source.getMarginsCss());
        }
        if (record.getMetadata() == null && source != null) {
            record.setMetadata(source.getMetadata());
        }
        if (record.getIsDefault() == null) {
            record.setIsDefault(false);
        }
        if (record.getIsActive() == null) {
            record.setIsActive(true);
        }
        record.setIsSystem(false);
        record.setCloneFromId(null);
    }

    @Override
    protected void beforeDelete(DocumentTemplate record) {
        if (Boolean.TRUE.equals(record.getIsSystem())) {
            throw RecordRuleException.refused("Les modèles système ne peuvent pas être supprimés");
        }
    }

    /**
     * Printable types declared by product modules, with a translatable label. No fallback list:
     * an empty result means no module declared one.
     */
    @GetMapping("/entity-types")
    @RequirePermission("read")
    public ResponseEntity<Map<String, List<PrintEntityTypeDescriptor>>> entityTypes() {
        templateService.ensureDefaultsForCurrentTenant();
        return ResponseEntity.ok(
                Map.of("entityTypes", variableCatalogService.listEntityTypeDescriptors()));
    }

    @GetMapping("/variables/{entityType}")
    @RequirePermission("read")
    public ResponseEntity<TemplateVariableCatalogResponse> getVariables(@PathVariable String entityType) {
        return ResponseEntity.ok(variableCatalogService.getCatalog(entityType));
    }

    /** Real records offered in the editor's "preview with" picker. */
    @GetMapping("/sample-records")
    @RequirePermission("read")
    public ResponseEntity<Map<String, List<SampleRecord>>> sampleRecords(
            @RequestParam String entityType,
            @RequestParam(required = false, defaultValue = "") String q) {
        List<SampleRecord> records = entityDataProviders.stream()
                .filter(p -> p.supports(entityType))
                .findFirst()
                .map(p -> p.searchRecords(entityType, q, SAMPLE_RECORD_LIMIT))
                .orElse(List.of());
        return ResponseEntity.ok(Map.of("records", records));
    }

    @PostMapping("/{id}/render")
    @RequirePermission("read")
    public ResponseEntity<byte[]> render(
            @PathVariable UUID id,
            @Valid @RequestBody TemplateRenderRequest request) {
        byte[] pdf = renderService.render(id, request.getEntityType(), request.getEntityId());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"document.pdf\"")
                .body(pdf);
    }

    @GetMapping("/{id}/preview")
    @RequirePermission("read")
    public ResponseEntity<byte[]> preview(@PathVariable UUID id) {
        byte[] pdf = renderService.renderPreview(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"preview.pdf\"")
                .body(pdf);
    }

    /**
     * Render an unsaved body. Persists nothing; a template mistake answers 400 with the position
     * so the editor can point at the line, and only an infrastructure failure answers 500.
     */
    @PostMapping("/preview")
    @RequirePermission("read")
    public ResponseEntity<?> previewDraft(@Valid @RequestBody TemplatePreviewRequest request) {
        try {
            String html = renderService.renderDraftHtml(
                    request.getTemplateBody(), request.getEntityType(), request.getSampleEntityId());
            if (!request.wantsPdf()) {
                return ResponseEntity.ok()
                        .contentType(new MediaType(MediaType.TEXT_HTML, StandardCharsets.UTF_8))
                        .body(html);
            }
            byte[] pdf = renderService.htmlToPdf(
                    html,
                    request.getEntityType(),
                    request.getPaperSize(),
                    request.getOrientation(),
                    request.getMarginsCss());
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"preview.pdf\"")
                    .body(pdf);
        } catch (TemplateRenderException e) {
            TemplateRenderError error = TemplateRenderError.from(e);
            HttpStatus status = e.getPhase() == TemplateRenderException.Phase.PDF
                    ? HttpStatus.SERVICE_UNAVAILABLE
                    : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status).body(error);
        }
    }

    private void requireBodyEditPermission() {
        if (!UserContext.hasPermission(EDIT_BODY_PERMISSION)) {
            throw new AccessDeniedException(
                    "Modifier le corps d'un modèle requiert la permission " + EDIT_BODY_PERMISSION);
        }
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
}
