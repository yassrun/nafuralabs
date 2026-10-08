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
@SecuredResource(domain = "administration", feature = "documents", resource = "templates")
@RequiredArgsConstructor
public class DocumentSettingsController {

    private final DocumentSettingsService settingsService;
    private final DocumentTemplateService templateService;
    private final TemplateRenderService renderService;

    /**
     * @param entityType optional; omitted returns the tenant-wide defaults
     */
    @GetMapping
    @RequirePermission("read")
    public ResponseEntity<DocumentSettingsPayload> get(
            @RequestParam(required = false) String entityType) {
        return ResponseEntity.ok(settingsService.get(entityType));
    }

    @PutMapping
    @RequirePermission("update")
    public ResponseEntity<DocumentSettingsPayload> save(
            @RequestParam(required = false) String entityType,
            @Valid @RequestBody DocumentSettingsPayload payload) {
        return ResponseEntity.ok(settingsService.save(entityType, payload));
    }

    @PostMapping("/reset")
    @RequirePermission("update")
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
    @RequirePermission("read")
    public ResponseEntity<String> preview(
            @RequestParam String entityType, @Valid @RequestBody DocumentSettingsPayload payload) {
        try {
            Map<String, String> fragments = settingsService.previewFragments(payload);
            DocumentTemplate template = templateService.findDefaultForEntityType(entityType);
            String body = template != null && template.getTemplateBody() != null
                    ? template.getTemplateBody()
                    : FALLBACK_PREVIEW_BODY;
            String html = renderService.renderDraftHtml(body, entityType, null, fragments);
            return htmlOk(html);
        } catch (RuntimeException e) {
            String message = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            String escaped = message.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
            return htmlOk("<p style=\"padding:1.5rem;color:#b42318\">" + escaped + "</p>");
        }
    }

    private static ResponseEntity<String> htmlOk(String html) {
        return ResponseEntity.ok()
                .contentType(new MediaType(MediaType.TEXT_HTML, StandardCharsets.UTF_8))
                .body(html);
    }

    /** Letterhead-only stand-in so identity settings remain previewable before a type has a body. */
    private static final String FALLBACK_PREVIEW_BODY =
            """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"/></head>
            <body>
              <div th:utext="${fragments.HEADER_DEFAULT}"></div>
              <h1 style="font-family:Helvetica,Arial,sans-serif;font-size:14pt"
                  th:text="${entity.numero != null ? entity.numero : 'Aperçu'}">Aperçu</h1>
              <p style="font-family:Helvetica,Arial,sans-serif;color:#555"
                 th:text="${entity.objet != null ? entity.objet : '—'}">—</p>
              <div th:utext="${fragments.FOOTER_DEFAULT}"></div>
            </body>
            </html>
            """;

    /** Data an administrator may insert into free text, for the "insert a value" menu. */
    @GetMapping("/tokens")
    @RequirePermission("read")
    public ResponseEntity<Map<String, List<String>>> tokens() {
        return ResponseEntity.ok(
                Map.of("tokens", DocumentTokenResolver.allowedTokens().stream().sorted().toList()));
    }
}
