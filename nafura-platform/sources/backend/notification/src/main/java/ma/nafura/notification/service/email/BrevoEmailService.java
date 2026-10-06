package ma.nafura.platform.collaboration.notification.service.email;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.appsettings.service.BrandColors;
import ma.nafura.platform.collaboration.notification.service.EmailException;
import ma.nafura.platform.collaboration.notification.service.EmailService;
import ma.nafura.platform.collaboration.notification.service.EmailService.EmailAttachment;
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
    private final String productName;
    private final int invitationExpiryDays;
    private final EmailTemplateService templateService;
    private final Supplier<BrandColors> brandColorsSupplier;
    private final ObjectMapper objectMapper;

    public BrevoEmailService(
            String apiKey,
            String fromAddress,
            String fromName,
            String productName,
            int invitationExpiryDays,
            EmailTemplateService templateService,
            Supplier<BrandColors> brandColorsSupplier) {
        this.fromAddress = fromAddress;
        this.fromName = fromName;
        this.productName = productName != null && !productName.isBlank() ? productName.trim() : "Nafura";
        this.invitationExpiryDays = invitationExpiryDays > 0 ? invitationExpiryDays : 7;
        this.templateService = templateService;
        this.brandColorsSupplier =
            brandColorsSupplier != null ? brandColorsSupplier : BrandColors::defaults;
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
        BrandColors brand = resolveBrand();
        Map<String, Object> variables =
            invitationVariables(toEmail, tenantName, inviteLink, inviterName, message, brand);
        if (templateService != null) {
            try {
                EmailTemplateService.RenderedEmail rendered = templateService.renderByCode("invitation", variables);
                sendEmail(toEmail, rendered.subject(), rendered.htmlBody(), rendered.textBody());
                return;
            } catch (Throwable e) {
                // LinkageError (wrong OGNL) must not abort delivery — fall back to built-in HTML.
                log.debug("DB template invitation not available, using fallback: {}", e.toString());
            }
        }
        sendEmail(
            toEmail,
            BuiltInEmailTemplates.invitationSubject(productName, tenantName),
            BuiltInEmailTemplates.invitationHtml(
                productName, tenantName, inviteLink, inviterName, message, invitationExpiryDays, brand.primary()),
            BuiltInEmailTemplates.invitationText(
                productName, tenantName, inviteLink, inviterName, message, invitationExpiryDays)
        );
    }

    @Override
    public void sendWelcomeEmail(String toEmail, String tenantName, String userName) {
        BrandColors brand = resolveBrand();
        Map<String, Object> variables = welcomeVariables(tenantName, userName, brand);
        if (templateService != null) {
            try {
                EmailTemplateService.RenderedEmail rendered = templateService.renderByCode("welcome", variables);
                sendEmail(toEmail, rendered.subject(), rendered.htmlBody(), rendered.textBody());
                return;
            } catch (Throwable e) {
                log.debug("DB template welcome not available, using fallback: {}", e.toString());
            }
        }
        sendEmail(
            toEmail,
            BuiltInEmailTemplates.welcomeSubject(productName, tenantName),
            BuiltInEmailTemplates.welcomeHtml(productName, tenantName, userName, brand.primary()),
            BuiltInEmailTemplates.welcomeText(productName, tenantName, userName)
        );
    }

    private BrandColors resolveBrand() {
        try {
            BrandColors colors = brandColorsSupplier.get();
            return colors != null ? colors : BrandColors.defaults();
        } catch (Exception e) {
            return BrandColors.defaults();
        }
    }

    private Map<String, Object> invitationVariables(
            String toEmail,
            String tenantName,
            String inviteLink,
            String inviterName,
            String message,
            BrandColors brand) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("product", Map.of("name", productName));
        variables.put("tenant", Map.of("name", tenantName != null ? tenantName : "Organization"));
        variables.put("brand", brand.asTemplateMap());
        variables.put(
            "inviter",
            Map.of("name", inviterName != null && !inviterName.isBlank() ? inviterName : "Un administrateur"));
        variables.put("inviteLink", inviteLink != null ? inviteLink : "");
        variables.put("invitee", Map.of("email", toEmail != null ? toEmail : ""));
        variables.put("message", message != null ? message : "");
        variables.put("expiryDays", invitationExpiryDays);
        return variables;
    }

    private Map<String, Object> welcomeVariables(String tenantName, String userName, BrandColors brand) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("product", Map.of("name", productName));
        variables.put("tenant", Map.of("name", tenantName != null ? tenantName : "Organization"));
        variables.put("brand", brand.asTemplateMap());
        variables.put(
            "user",
            Map.of("firstName", userName != null && !userName.isBlank() ? userName : "User"));
        return variables;
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
            if (fromAddress == null || fromAddress.isBlank()) {
                throw new EmailException("Brevo sender email is missing (app.email.from-address)");
            }
            ObjectNode body = objectMapper.createObjectNode();
            ObjectNode sender = body.putObject("sender");
            sender.put("email", fromAddress.trim());
            if (fromName != null && !fromName.isBlank()) {
                sender.put("name", fromName.trim());
            }

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

            // JsonNode as body can be serialized empty by RestClient; send explicit JSON bytes.
            byte[] payload = objectMapper.writeValueAsBytes(body);
            restClient.post()
                .uri("/smtp/email")
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload)
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
