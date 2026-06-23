package ma.nafura.platform.collaboration.notification.service;

import java.util.List;

/**
 * Service interface for sending emails.
 * 
 * Implementations can use SendGrid, Mailgun, AWS SES, etc.
 */
public interface EmailService {
    
    /**
     * Send an invitation email to a new member.
     * 
     * @param toEmail Recipient email address
     * @param tenantName Name of the tenant/organization
     * @param inviteLink Full URL to accept the invitation
     * @param inviterName Name of the person who sent the invitation
     * @param message Optional personal message from the inviter
     */
    void sendInvitationEmail(
        String toEmail,
        String tenantName,
        String inviteLink,
        String inviterName,
        String message
    );
    
    /**
     * Send a welcome email to a newly activated member.
     * 
     * @param toEmail Recipient email address
     * @param tenantName Name of the tenant/organization
     * @param userName Name of the new member
     */
    void sendWelcomeEmail(
        String toEmail,
        String tenantName,
        String userName
    );
    
    /**
     * Send a generic email with custom subject and content.
     * 
     * @param toEmail Recipient email address
     * @param subject Email subject
     * @param htmlContent HTML content of the email
     * @param textContent Plain text content (optional, for fallback)
     */
    void sendEmail(
        String toEmail,
        String subject,
        String htmlContent,
        String textContent
    );

    /**
     * Send an email with multiple recipients and optional attachments (e.g. entity email with PDF).
     *
     * @param to Recipient email addresses (at least one)
     * @param cc CC addresses (optional, can be empty)
     * @param subject Subject line
     * @param htmlContent HTML body
     * @param textContent Plain text body (optional)
     * @param attachments Optional list of attachments (filename, mimeType, content bytes)
     */
    void sendWithAttachments(
        List<String> to,
        List<String> cc,
        String subject,
        String htmlContent,
        String textContent,
        List<EmailAttachment> attachments
    );

    record EmailAttachment(String filename, String mimeType, byte[] content) {}
}

