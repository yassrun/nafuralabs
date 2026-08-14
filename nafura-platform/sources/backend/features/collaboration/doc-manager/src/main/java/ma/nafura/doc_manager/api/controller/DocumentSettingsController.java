package ma.nafura.platform.collaboration.docmanager.api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.collaboration.docmanager.api.request.DocumentSettingsPayload;
import ma.nafura.platform.collaboration.docmanager.domain.model.DocumentTemplate;
import ma.nafura.platform.collaboration.docmanager.service.DocumentSettingsService;
import ma.nafura.platform.collaboration.docmanager.service.DocumentTemplateService;
import ma.nafura.platform.collaboration.docmanager.template.DocumentTokenResolver;
import ma.nafura.platform.collaboration.docmanager.template.TemplateRenderService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/**
 * Document customisation for tenant administrators: structured settings only, no markup.
 *
 * <p>Separate from {@code /templates}: editing a template body is an internal operation, while
 * this screen is what a customer uses.
 */
@RestController
@RequestMapping("/api/v1/platform/document-settings")
@SecuredResource(domain = "administration", feature = "administration", resource = "templates")
@RequiredArgsConstructor
public class DocumentSettingsController {

    private final DocumentSettingsService settingsService;
    private final DocumentTemplateService templateService;
    private final TemplateRenderService renderService;

    /**
     * @param entityType optional; omitted returns the tenant-wide defaults
     */
    @GetMapping
    @RequirePermission(value = "administration.templates.read", fullPermission = true)
    public ResponseEntity<DocumentSettingsPayload> get(
            @RequestParam(required = false) String entityType) {
        return ResponseEntity.ok(settingsService.get(entityType));
    }

    @PutMapping
    @RequirePermission(value = "administration.templates.write", fullPermission = true)
    public ResponseEntity<DocumentSettingsPayload> save(
            @RequestParam(required = false) String entityType,
            @Valid @RequestBody DocumentSettingsPayload payload) {
        return ResponseEntity.ok(settingsService.save(entityType, payload));
    }

    @PostMapping("/reset")
    @RequirePermission(value = "administration.templates.write", fullPermission = true)
    public ResponseEntity<DocumentSettingsPayload> reset(
            @RequestParam(required = false) String entityType) {
        return ResponseEntity.ok(settingsService.reset(entityType));
    }

    /**
     * Render the default template of a type with the settings being edited, without saving.
     * Previewing the stored settings instead would show the administrator the state they just
     * changed away from.
     */
    @PostMapping("/preview")
    @RequirePermission(value = "administration.templates.read", fullPermission = true)
    public ResponseEntity<String> preview(
            @RequestParam String entityType, @Valid @RequestBody DocumentSettingsPayload payload) {
        DocumentTemplate template = templateService.findDefaultForEntityType(entityType);
        if (template == null || template.getTemplateBody() == null) {
            return ResponseEntity.noContent().build();
        }
        String html = renderService.renderDraftHtml(
                template.getTemplateBody(),
                entityType,
                null,
                settingsService.previewFragments(payload));
        return ResponseEntity.ok()
                .contentType(new MediaType(MediaType.TEXT_HTML, StandardCharsets.UTF_8))
                .body(html);
    }

    /** Data an administrator may insert into free text, for the "insert a value" menu. */
    @GetMapping("/tokens")
    @RequirePermission(value = "administration.templates.read", fullPermission = true)
    public ResponseEntity<Map<String, List<String>>> tokens() {
        return ResponseEntity.ok(
                Map.of("tokens", DocumentTokenResolver.allowedTokens().stream().sorted().toList()));
    }
}
