package ma.nafura.platform.collaboration.notification.service.email;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.collaboration.notification.service.EmailException;
import ma.nafura.platform.collaboration.notification.service.EmailService;
import ma.nafura.platform.collaboration.notification.service.EmailTemplateService;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

/**
 * Brevo (ex-Sendinblue) transactional email via REST API.
 */
@Slf4j
public class BrevoEmailService implements EmailService {

    private final RestClient restClient;
    private final String fromAddress;
    private final String fromName;
    private final EmailTemplateService templateService;
    private final ObjectMapper objectMapper;

    public BrevoEmailService(String apiKey, String fromAddress, String fromName, EmailTemplateService templateService) {
        this.fromAddress = fromAddress;
        this.fromName = fromName;
        this.templateService = templateService;
        this.objectMapper = new ObjectMapper();
        this.restClient = RestClient.builder()
            .baseUrl("https://api.brevo.com/v3")
            .defaultHeader("api-key", apiKey)
            .build();
    }

    @Override
    public void sendInvitationEmail(
        String toEmail,
        String tenantName,
        String inviteLink,
        String inviterName,
        String message
    ) {
        Map<String, Object> variables = Map.of(
            "tenant", Map.of("name", tenantName != null ? tenantName : "Organization"),
            "inviter", Map.of("name", inviterName != null && !inviterName.isBlank() ? inviterName : "Un administrateur"),
            "inviteLink", inviteLink != null ? inviteLink : "",
            "invitee", Map.of("email", toEmail != null ? toEmail : ""),
            "message", message != null ? message : ""
        );
        if (templateService != null) {
            try {
                EmailTemplateService.RenderedEmail rendered = templateService.renderByCode("invitation", variables);
                sendEmail(toEmail, rendered.subject(), rendered.htmlBody(), rendered.textBody());
                return;
            } catch (Exception e) {
                log.debug("DB template invitation not available, using fallback: {}", e.getMessage());
            }
        }
        String subject = String.format("Invitation à rejoindre %s sur Nafura", tenantName);
        sendEmail(
            toEmail,
            subject,
            BuiltInEmailTemplates.invitationHtml(tenantName, inviteLink, inviterName, message),
            BuiltInEmailTemplates.invitationText(tenantName, inviteLink, inviterName, message)
        );
    }

    @Override
    public void sendWelcomeEmail(String toEmail, String tenantName, String userName) {
        Map<String, Object> variables = Map.of(
            "tenant", Map.of("name", tenantName != null ? tenantName : "Organization"),
            "user", Map.of("firstName", userName != null && !userName.isBlank() ? userName : "User")
        );
        if (templateService != null) {
            try {
                EmailTemplateService.RenderedEmail rendered = templateService.renderByCode("welcome", variables);
                sendEmail(toEmail, rendered.subject(), rendered.htmlBody(), rendered.textBody());
                return;
            } catch (Exception e) {
                log.debug("DB template welcome not available, using fallback: {}", e.getMessage());
            }
        }
        String subject = String.format("Bienvenue dans %s sur Nafura", tenantName);
        sendEmail(
            toEmail,
            subject,
            BuiltInEmailTemplates.welcomeHtml(tenantName, userName),
            BuiltInEmailTemplates.welcomeText(tenantName, userName)
        );
    }

    @Override
    public void sendEmail(String toEmail, String subject, String htmlContent, String textContent) {
        sendWithAttachments(List.of(toEmail), List.of(), subject, htmlContent, textContent, List.of());
    }

    @Override
    public void sendWithAttachments(
        List<String> to,
        List<String> cc,
        String subject,
        String htmlContent,
        String textContent,
        List<EmailAttachment> attachments
    ) {
        if (to == null || to.isEmpty()) {
            throw new IllegalArgumentException("At least one 'to' recipient is required");
        }
        try {
            ObjectNode body = objectMapper.createObjectNode();
            ObjectNode sender = body.putObject("sender");
            sender.put("email", fromAddress);
            sender.put("name", fromName);

            ArrayNode toNodes = body.putArray("to");
            for (String email : to) {
                if (email != null && !email.isBlank()) {
                    toNodes.addObject().put("email", email.trim());
                }
            }
            if (cc != null && !cc.isEmpty()) {
                ArrayNode ccNodes = body.putArray("cc");
                for (String email : cc) {
                    if (email != null && !email.isBlank()) {
                        ccNodes.addObject().put("email", email.trim());
                    }
                }
            }
            body.put("subject", subject);
            if (htmlContent != null && !htmlContent.isBlank()) {
                body.put("htmlContent", htmlContent);
            }
            if (textContent != null && !textContent.isBlank()) {
                body.put("textContent", textContent);
            }
            if (attachments != null && !attachments.isEmpty()) {
                ArrayNode attNodes = body.putArray("attachment");
                for (EmailAttachment att : attachments) {
                    attNodes.addObject()
                        .put("name", att.filename())
                        .put("content", Base64.getEncoder().encodeToString(att.content()));
                }
            }

            restClient.post()
                .uri("/smtp/email")
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .toBodilessEntity();

            log.info("Email sent via Brevo to {}: {}", to, subject);
        } catch (RestClientResponseException ex) {
            log.error("Brevo failed to send email to {}: {} - {}", to, ex.getStatusCode().value(), ex.getResponseBodyAsString());
            throw new EmailException(
                String.format("Failed to send email: %d - %s", ex.getStatusCode().value(), ex.getResponseBodyAsString()),
                ex
            );
        } catch (Exception ex) {
            log.error("Brevo error sending email to {}", to, ex);
            throw new EmailException("Failed to send email", ex);
        }
    }
}
