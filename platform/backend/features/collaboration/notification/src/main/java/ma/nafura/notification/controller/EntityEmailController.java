package ma.nafura.platform.collaboration.notification.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.collaboration.notification.service.EntityEmailRequest;
import ma.nafura.platform.collaboration.notification.service.EntityEmailService;
import ma.nafura.platform.collaboration.notification.service.EmailTemplateService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/platform/email")
@SecuredResource(domain = "platform", feature = "collaboration", resource = "email")
@RequiredArgsConstructor
public class EntityEmailController {

    private final EntityEmailService entityEmailService;
    private final EmailTemplateService emailTemplateService;
    private final ma.nafura.platform.collaboration.docmanager.template.TemplateVariableResolver variableResolver;

    /**
     * Send an entity email: render email template with entity data, optional PDF attachment, send via SendGrid, log audit.
     */
    @PostMapping("/send")
    @RequirePermission(value = "platform.collaboration.email.send", fullPermission = true)
    public ResponseEntity<Void> send(@Valid @RequestBody EntityEmailRequest request) {
        entityEmailService.send(request);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    /**
     * Preview rendered subject and body for the given template and entity (for compose dialog).
     */
    @PostMapping("/preview")
    @RequirePermission(value = "platform.collaboration.email.send", fullPermission = true)
    public ResponseEntity<EmailPreviewResponse> preview(@RequestBody EmailPreviewRequest request) {
        var template = emailTemplateService.getById(request.emailTemplateId());
        var variables = variableResolver.resolve(request.entityType(), request.entityId());
        var rendered = emailTemplateService.render(template, variables);
        return ResponseEntity.ok(new EmailPreviewResponse(
                rendered.subject(),
                rendered.htmlBody(),
                rendered.textBody()
        ));
    }

    public record EmailPreviewRequest(UUID emailTemplateId, String entityType, UUID entityId) {}

    public record EmailPreviewResponse(String subject, String htmlBody, String textBody) {}
}
