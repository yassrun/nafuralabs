package ma.nafura.platform.collaboration.notification.service;

import ma.nafura.platform.collaboration.audit.AuditService;
import ma.nafura.platform.collaboration.docmanager.template.TemplateRenderService;
import ma.nafura.platform.collaboration.docmanager.template.TemplateVariableResolver;
import ma.nafura.platform.collaboration.notification.domain.model.EmailTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Orchestrates sending an email for an entity: load template, resolve variables, optional PDF, send, audit.
 */
@Service
public class EntityEmailService {

    private static final String AUDIT_ACTION_EMAILED = "emailed";

    private final EmailTemplateService emailTemplateService;
    private final TemplateVariableResolver variableResolver;
    private final TemplateRenderService templateRenderService;
    private final EmailService emailService;
    private final AuditService auditService;

    public EntityEmailService(
            EmailTemplateService emailTemplateService,
            TemplateVariableResolver variableResolver,
            TemplateRenderService templateRenderService,
            EmailService emailService,
            AuditService auditService) {
        this.emailTemplateService = emailTemplateService;
        this.variableResolver = variableResolver;
        this.templateRenderService = templateRenderService;
        this.emailService = emailService;
        this.auditService = auditService;
    }

    /**
     * Send entity email: render template with entity data, optionally attach PDF, send, and log audit.
     */
    public void send(EntityEmailRequest request) {
        EmailTemplate template = emailTemplateService.getById(request.emailTemplateId());
        Map<String, Object> variables = variableResolver.resolve(request.entityType(), request.entityId());
        EmailTemplateService.RenderedEmail rendered = emailTemplateService.render(template, variables);

        List<EmailService.EmailAttachment> attachments = new ArrayList<>();
        if (request.attachPdf() && request.printTemplateId() != null) {
            byte[] pdf = templateRenderService.render(
                    request.printTemplateId(),
                    request.entityType(),
                    request.entityId()
            );
            String filename = request.entityType() + "-" + request.entityId() + ".pdf";
            attachments.add(new EmailService.EmailAttachment(filename, "application/pdf", pdf));
        }

        emailService.sendWithAttachments(
                request.to(),
                request.cc(),
                rendered.subject(),
                rendered.htmlBody(),
                rendered.textBody(),
                attachments
        );

        auditService.log(
                request.entityType(),
                request.entityId(),
                AUDIT_ACTION_EMAILED,
                "Emailed to " + String.join(", ", request.to()),
                Map.of(
                        "to", request.to(),
                        "emailTemplateId", request.emailTemplateId().toString(),
                        "attachPdf", request.attachPdf()
                )
        );
    }
}
