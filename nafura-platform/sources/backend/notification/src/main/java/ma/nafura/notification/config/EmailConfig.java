package ma.nafura.platform.collaboration.notification.config;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.collaboration.notification.service.EmailService;
import ma.nafura.platform.collaboration.notification.service.EmailTemplateService;
import ma.nafura.platform.collaboration.notification.service.email.BrevoEmailService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.core.io.Resource;

/**
 * Email provider configuration (Brevo by default).
 * Set {@code app.email.provider=brevo} and {@code brevo.api-key} (or Vault {@code BREVO_API_KEY}).
 */
@Slf4j
@Configuration
public class EmailConfig {

    @Value("${app.email.provider:brevo}")
    private String emailProvider;

    @Bean
    @ConditionalOnMissingBean(EmailService.class)
    public EmailService emailService(
            @Value("${brevo.api-key:}") String brevoApiKey,
            @Value("${app.email.from-address:noreply@nafuralabs.com}") String fromAddress,
            // Empty from-name → product name from app.nafura.json
            @Value("${app.email.from-name:}") String fromName,
            EmailTemplateService templateService) {
        log.info("Configuring email provider: {}", emailProvider);

        switch (emailProvider.toLowerCase()) {
            case "brevo":
            case "sendinblue":
                if (brevoApiKey == null || brevoApiKey.isBlank()) {
                    log.warn("Brevo API key not set; using no-op email service (emails will not be sent)");
                    return noOpEmailService();
                }
                String senderEmail = fromAddress == null ? "" : fromAddress.trim();
                if (senderEmail.isBlank()) {
                    senderEmail = "noreply@nafuralabs.com";
                }
                String senderName = senderName(fromName);
                log.info("Creating Brevo email client (from={} name={})", senderEmail, senderName);
                return new BrevoEmailService(brevoApiKey.trim(), senderEmail, senderName, templateService);
            default:
                throw new IllegalStateException(
                    String.format("Unsupported email provider: %s. Supported: brevo", emailProvider)
                );
        }
    }

    private String senderName(String fromName) {
        if (fromName != null && !fromName.isBlank()) return fromName.trim();
        Resource manifest = new DefaultResourceLoader().getResource("classpath:nafura/app.nafura.json");
        if (!manifest.exists()) return "Nafura";
        try (InputStream in = manifest.getInputStream()) {
            return new ObjectMapper().readTree(in).path("spec").path("product").path("name").asText("Nafura");
        } catch (IOException e) {
            return "Nafura";
        }
    }

    private static EmailService noOpEmailService() {
        return new EmailService() {
            @Override
            public void sendInvitationEmail(String toEmail, String tenantName, String inviteLink, String inviterName, String message) {}
            @Override
            public void sendWelcomeEmail(String toEmail, String tenantName, String userName) {}
            @Override
            public void sendEmail(String toEmail, String subject, String htmlContent, String textContent) {
                log.warn("Email NOT sent (no provider API key): to={} subject={}", toEmail, subject);
            }
            @Override
            public void sendWithAttachments(
                    List<String> to,
                    List<String> cc,
                    String subject,
                    String htmlContent,
                    String textContent,
                    List<EmailAttachment> attachments) {}
        };
    }
}
