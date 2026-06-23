package ma.nafura.platform.collaboration.docmanager.api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.collaboration.docmanager.api.request.DocumentTemplateCreateRequest;
import ma.nafura.platform.collaboration.docmanager.api.request.DocumentTemplateUpdateRequest;
import ma.nafura.platform.collaboration.docmanager.api.request.TemplateRenderRequest;
import ma.nafura.platform.collaboration.docmanager.api.response.TemplateVariableCatalogResponse;
import ma.nafura.platform.collaboration.docmanager.domain.model.DocumentTemplate;
import ma.nafura.platform.collaboration.docmanager.service.DocumentTemplateService;
import ma.nafura.platform.collaboration.docmanager.template.TemplateRenderService;
import ma.nafura.platform.collaboration.docmanager.template.TemplateVariableCatalogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/platform/templates")
@SecuredResource(domain = "administration", feature = "administration", resource = "templates")
@RequiredArgsConstructor
public class TemplateController {

    private final DocumentTemplateService templateService;
    private final TemplateRenderService renderService;
    private final TemplateVariableCatalogService variableCatalogService;

    @GetMapping
    @RequirePermission(value = "administration.templates.read", fullPermission = true)
    public ResponseEntity<Page<DocumentTemplate>> list(
            @RequestParam(required = false) String entityType,
            Pageable pageable) {
        return ResponseEntity.ok(templateService.list(entityType, pageable));
    }

    @GetMapping("/variables/{entityType}")
    @RequirePermission(value = "administration.templates.read", fullPermission = true)
    public ResponseEntity<TemplateVariableCatalogResponse> getVariables(@PathVariable String entityType) {
        return ResponseEntity.ok(variableCatalogService.getCatalog(entityType));
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
        return ResponseEntity.ok(templateService.update(id, request));
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
}
