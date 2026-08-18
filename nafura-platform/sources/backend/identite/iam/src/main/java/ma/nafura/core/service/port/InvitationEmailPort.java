package ma.nafura.platform.administration.iam.service.port;

/**
 * Outbound port for invitation and welcome emails.
 * Implemented by the product application (e.g. Brevo adapter).
 */
public interface InvitationEmailPort {

    boolean isAvailable();

    void sendInvitationEmail(
        String toEmail,
        String tenantName,
        String inviteLink,
        String inviterName,
        String message
    );

    void sendWelcomeEmail(String toEmail, String tenantName, String userName);
}
