package ma.nafura.platform.administration.iam.service.port;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@ConditionalOnMissingBean(InvitationEmailPort.class)
public class NoOpInvitationEmailPort implements InvitationEmailPort {

    @Override
    public boolean isAvailable() {
        return false;
    }

    @Override
    public void sendInvitationEmail(
        String toEmail,
        String tenantName,
        String inviteLink,
        String inviterName,
        String message
    ) {
        log.warn("Invitation email NOT sent to {} (no InvitationEmailPort bean)", toEmail);
        throw new IllegalStateException("EMAIL_DELIVERY_FAILED");
    }

    @Override
    public void sendWelcomeEmail(String toEmail, String tenantName, String userName) {
        log.debug("Welcome email skipped for {} (no InvitationEmailPort bean)", toEmail);
    }
}
