package ma.nafura.socle.invitation;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.administration.iam.service.port.InvitationEmailPort;
import ma.nafura.platform.collaboration.notification.service.EmailService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
public class BrevoInvitationEmailAdapter implements InvitationEmailPort {

    private final EmailService emailService;

    @Value("${brevo.api-key:}")
    private String brevoApiKey;

    @Override
    public boolean isAvailable() {
        return StringUtils.hasText(brevoApiKey);
    }

    @Override
    public void sendInvitationEmail(
        String toEmail,
        String tenantName,
        String inviteLink,
        String inviterName,
        String message
    ) {
        if (!isAvailable()) {
            throw new IllegalStateException("EMAIL_DELIVERY_FAILED");
        }
        emailService.sendInvitationEmail(toEmail, tenantName, inviteLink, inviterName, message);
    }

    @Override
    public void sendWelcomeEmail(String toEmail, String tenantName, String userName) {
        if (!isAvailable()) {
            return;
        }
        emailService.sendWelcomeEmail(toEmail, tenantName, userName);
    }
}
