package ma.nafura.platform.collaboration.notification.config;

import com.sendgrid.SendGrid;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.collaboration.notification.service.EmailService;
import ma.nafura.platform.collaboration.notification.service.EmailTemplateService;
import ma.nafura.platform.collaboration.notification.service.email.BrevoEmailService;
import ma.nafura.platform.collaboration.notification.service.email.SendGridEmailService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for email services.
 * 
 * Supports multiple email providers (SendGrid, Mailgun, etc.) via configuration.
 * Change provider by setting: app.email.provider=sendgrid|mailgun|...
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
    
    /**
     * Create EmailService bean based on configuration.
     * Defaults to SendGrid if not specified.
     * 
     * To switch provider, set: app.email.provider=sendgrid|mailgun|ses|...
     */
    @Bean
    @ConditionalOnMissingBean(EmailService.class)
    public EmailService emailService(
            @Value("${brevo.api-key:}") String brevoApiKey,
            @Value("${sendgrid.api-key:}") String sendGridApiKey,
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
            case "sendgrid":
                if (sendGridApiKey == null || sendGridApiKey.isBlank()) {
                    log.warn("SendGrid API key not set; using no-op email service (emails will not be sent)");
                    return noOpEmailService();
                }
                SendGrid sendGrid = new SendGrid(sendGridApiKey.trim());
                log.info("Creating SendGrid client");
                return new SendGridEmailService(sendGrid, fromAddress, fromName, templateService);
            default:
                throw new IllegalStateException(
                    String.format("Unsupported email provider: %s. Supported: brevo, sendgrid", emailProvider)
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
