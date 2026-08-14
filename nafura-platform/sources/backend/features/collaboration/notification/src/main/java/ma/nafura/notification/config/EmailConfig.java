package ma.nafura.platform.collaboration.notification.config;

import java.util.List;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.collaboration.notification.service.EmailService;
import ma.nafura.platform.collaboration.notification.service.EmailTemplateService;
import ma.nafura.platform.collaboration.notification.service.email.BrevoEmailService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Email provider configuration (Brevo by default).
 * Set {@code app.email.provider=brevo} and {@code brevo.api-key} (or Vault {@code BREVO_API_KEY}).
 */
@Slf4j
@Configuration
public class EmailConfig {

    @Value("${app.email.provider:brevo}")
    private String emailProvider;

    @Value("${app.email.from-address:noreply@seyrura.com}")
    private String fromAddress;

    @Value("${app.email.from-name:Seyrura}")
    private String fromName;

    @Bean
    @ConditionalOnMissingBean(EmailService.class)
    public EmailService emailService(
            @Value("${brevo.api-key:}") String brevoApiKey,
            EmailTemplateService templateService) {
        log.info("Configuring email provider: {}", emailProvider);

        switch (emailProvider.toLowerCase()) {
            case "brevo":
            case "sendinblue":
                if (brevoApiKey == null || brevoApiKey.isBlank()) {
                    log.warn("Brevo API key not set; using no-op email service (emails will not be sent)");
                    return noOpEmailService();
                }
                log.info("Creating Brevo email client");
                return new BrevoEmailService(brevoApiKey.trim(), fromAddress, fromName, templateService);
            default:
                throw new IllegalStateException(
                    String.format("Unsupported email provider: %s. Supported: brevo", emailProvider)
                );
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
