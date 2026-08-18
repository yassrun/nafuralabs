package ma.nafura.platform.collaboration.notification.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.collaboration.notification.domain.model.EmailTemplate;
import ma.nafura.platform.collaboration.notification.service.EmailTemplateService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/platform/email-templates")
@SecuredResource(domain = "administration", feature = "administration", resource = "email-templates")
@RequiredArgsConstructor
public class EmailTemplateController {

    private final EmailTemplateService templateService;

    @GetMapping
    @RequirePermission(value = "administration.email.read", fullPermission = true)
    public ResponseEntity<Page<EmailTemplate>> list(
            @RequestParam(required = false) Boolean system,
            @RequestParam(required = false) String entityType,
            Pageable pageable) {
        return ResponseEntity.ok(templateService.list(system, entityType, pageable));
    }

    @GetMapping("/{id}")
    @RequirePermission(value = "administration.email.read", fullPermission = true)
    public ResponseEntity<EmailTemplate> get(@PathVariable UUID id) {
        return templateService.get(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @RequirePermission(value = "administration.email.write", fullPermission = true)
    public ResponseEntity<EmailTemplate> create(@Valid @RequestBody EmailTemplateService.EmailTemplateCreateRequest request) {
        EmailTemplate created = templateService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @RequirePermission(value = "administration.email.write", fullPermission = true)
    public ResponseEntity<EmailTemplate> update(
            @PathVariable UUID id,
            @Valid @RequestBody EmailTemplateService.EmailTemplateUpdateRequest request) {
        return ResponseEntity.ok(templateService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @RequirePermission(value = "administration.email.write", fullPermission = true)
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        templateService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Preview: render template with provided variables (e.g. sample data).
     */
    @PostMapping("/{id}/preview")
    @RequirePermission(value = "administration.email.read", fullPermission = true)
    public ResponseEntity<EmailTemplatePreviewResponse> preview(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, Object> variables) {
        EmailTemplate template = templateService.get(id)
                .orElseThrow(() -> new IllegalArgumentException("Email template not found: " + id));
        EmailTemplateService.RenderedEmail rendered = templateService.render(
                template,
                variables != null ? variables : Map.of());
        return ResponseEntity.ok(new EmailTemplatePreviewResponse(
                rendered.subject(),
                rendered.htmlBody(),
                rendered.textBody()));
    }

    public record EmailTemplatePreviewResponse(String subject, String htmlBody, String textBody) {}
}
