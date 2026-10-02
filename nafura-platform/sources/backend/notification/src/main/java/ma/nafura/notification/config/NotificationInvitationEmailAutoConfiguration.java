package ma.nafura.platform.collaboration.notification.config;

import ma.nafura.platform.administration.iam.service.port.InvitationEmailPort;
import ma.nafura.platform.collaboration.notification.service.EmailService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.util.StringUtils;

/** Delivers IAM invitation mails through {@link EmailService} when both capabilities are embedded. */
@AutoConfiguration(beforeName = "ma.nafura.platform.administration.iam.config.NafuraIamAutoConfiguration")
@ConditionalOnClass(name = "ma.nafura.platform.administration.iam.service.port.InvitationEmailPort")
public class NotificationInvitationEmailAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    InvitationEmailPort invitationEmailPort(EmailService emailService, @Value("${brevo.api-key:}") String brevoApiKey) {
        return new InvitationEmailPort() {
            @Override
            public boolean isAvailable() {
                return StringUtils.hasText(brevoApiKey);
            }

            @Override
            public void sendInvitationEmail(String toEmail, String tenantName, String inviteLink,
                                            String inviterName, String message) {
                if (!isAvailable()) {
                    throw new IllegalStateException("EMAIL_DELIVERY_FAILED");
                }
                emailService.sendInvitationEmail(toEmail, tenantName, inviteLink, inviterName, message);
            }

            @Override
            public void sendWelcomeEmail(String toEmail, String tenantName, String userName) {
                if (isAvailable()) {
                    emailService.sendWelcomeEmail(toEmail, tenantName, userName);
                }
            }
        };
    }
}
