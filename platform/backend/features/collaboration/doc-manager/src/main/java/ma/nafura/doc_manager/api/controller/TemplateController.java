package ma.nafura.platform.collaboration.docmanager.api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.collaboration.docmanager.api.request.DocumentTemplateCreateRequest;
import ma.nafura.platform.collaboration.docmanager.api.request.DocumentTemplateUpdateRequest;
import ma.nafura.platform.collaboration.docmanager.api.request.TemplatePreviewRequest;
import ma.nafura.platform.collaboration.docmanager.api.request.TemplateRenderRequest;
import ma.nafura.platform.collaboration.docmanager.api.response.TemplateRenderError;
import ma.nafura.platform.collaboration.docmanager.api.response.TemplateVariableCatalogResponse;
import ma.nafura.platform.collaboration.docmanager.domain.model.DocumentTemplate;
import ma.nafura.platform.collaboration.docmanager.service.DocumentTemplateService;
import ma.nafura.platform.collaboration.docmanager.template.EntityDataProvider;
import ma.nafura.platform.collaboration.docmanager.template.PrintEntityTypeDescriptor;
import ma.nafura.platform.collaboration.docmanager.template.SampleRecord;
import ma.nafura.platform.collaboration.docmanager.template.TemplateRenderException;
import ma.nafura.platform.collaboration.docmanager.template.TemplateRenderService;
import ma.nafura.platform.collaboration.docmanager.template.TemplateVariableCatalogService;
import ma.nafura.platform.framework.context.UserContext;
import org.springframework.data.domain.Page;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/platform/templates")
@SecuredResource(domain = "administration", feature = "administration", resource = "templates")
@RequiredArgsConstructor
public class TemplateController {

    private static final int SAMPLE_RECORD_LIMIT = 20;

    /**
     * Editing a raw template body is an internal operation, not a customer feature: the body is
     * evaluated server-side, so it is gated behind its own permission. Tenant administrators keep
     * read access and the customisation screen, which never produces markup.
     */
    private static final String EDIT_BODY_PERMISSION = "administration.templates.editBody";

    private final DocumentTemplateService templateService;
    private final TemplateRenderService renderService;
    private final TemplateVariableCatalogService variableCatalogService;
    private final List<EntityDataProvider> entityDataProviders;

    @GetMapping
    @RequirePermission(value = "administration.templates.read", fullPermission = true)
    public ResponseEntity<Page<DocumentTemplate>> list(
            @RequestParam(required = false) String entityType,
            Pageable pageable) {
        return ResponseEntity.ok(templateService.list(entityType, pageable));
    }

    /**
     * Printable types declared by product modules, with a translatable label. No fallback list:
     * an empty result means no module declared one.
     */
    @GetMapping("/entity-types")
    @RequirePermission(value = "administration.templates.read", fullPermission = true)
    public ResponseEntity<Map<String, List<PrintEntityTypeDescriptor>>> entityTypes() {
        return ResponseEntity.ok(
                Map.of("entityTypes", variableCatalogService.listEntityTypeDescriptors()));
    }

    @GetMapping("/variables/{entityType}")
    @RequirePermission(value = "administration.templates.read", fullPermission = true)
    public ResponseEntity<TemplateVariableCatalogResponse> getVariables(@PathVariable String entityType) {
        return ResponseEntity.ok(variableCatalogService.getCatalog(entityType));
    }

    /** Real records offered in the editor's "preview with" picker. */
    @GetMapping("/sample-records")
    @RequirePermission(value = "administration.templates.read", fullPermission = true)
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

    @PostMapping
    @RequirePermission(value = "administration.templates.write", fullPermission = true)
    public ResponseEntity<DocumentTemplate> create(@Valid @RequestBody DocumentTemplateCreateRequest request) {
        DocumentTemplate created = templateService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    @RequirePermission(value = "administration.templates.read", fullPermission = true)
    public ResponseEntity<DocumentTemplate> get(@PathVariable UUID id) {
        return ResponseEntity.ok(templateService.get(id));
    }

    @PutMapping("/{id}")
    @RequirePermission(value = "administration.templates.write", fullPermission = true)
    public ResponseEntity<DocumentTemplate> update(
            @PathVariable UUID id,
            @Valid @RequestBody DocumentTemplateUpdateRequest request) {
        requireBodyEditPermission(request.getTemplateBody());
        return ResponseEntity.ok(templateService.update(id, request));
    }

    /**
     * Metadata changes (name, default flag, page setup) stay open to tenant administrators;
     * supplying a body requires the internal permission.
     */
    private void requireBodyEditPermission(String templateBody) {
        if (templateBody == null) {
            return;
        }
        if (!UserContext.hasPermission(EDIT_BODY_PERMISSION)) {
            throw new AccessDeniedException(
                    "Modifier le corps d'un modèle requiert la permission " + EDIT_BODY_PERMISSION);
        }
    }

    @DeleteMapping("/{id}")
    @RequirePermission(value = "administration.templates.write", fullPermission = true)
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        templateService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/render")
    @RequirePermission(value = "administration.templates.read", fullPermission = true)
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
    @RequirePermission(value = "administration.templates.read", fullPermission = true)
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
    @RequirePermission(value = "administration.templates.read", fullPermission = true)
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
                    html, request.getPaperSize(), request.getOrientation(), request.getMarginsCss());
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
}
