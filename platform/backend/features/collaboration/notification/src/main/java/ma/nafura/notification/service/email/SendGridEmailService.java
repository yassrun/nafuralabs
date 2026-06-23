package ma.nafura.platform.collaboration.notification.service.email;

import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Attachments;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import ma.nafura.platform.collaboration.notification.service.EmailService.EmailAttachment;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.collaboration.notification.service.EmailException;
import ma.nafura.platform.collaboration.notification.service.EmailService;
import ma.nafura.platform.collaboration.notification.service.EmailTemplateService;

import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * SendGrid implementation of EmailService.
 * 
 * This class should NOT be annotated with @Service directly.
 * It's instantiated via EmailConfig based on configuration.
 */
@Slf4j
public class SendGridEmailService implements EmailService {

    private final SendGrid sendGrid;
    private final String fromAddress;
    private final String fromName;
    private final EmailTemplateService templateService;

    public SendGridEmailService(SendGrid sendGrid) {
        this(sendGrid, "noreply@seyrura.com", "Seyrura", null);
    }

    public SendGridEmailService(SendGrid sendGrid, String fromAddress, String fromName) {
        this(sendGrid, fromAddress, fromName, null);
    }

    public SendGridEmailService(SendGrid sendGrid, String fromAddress, String fromName, EmailTemplateService templateService) {
        this.sendGrid = sendGrid;
        this.fromAddress = fromAddress;
        this.fromName = fromName;
        this.templateService = templateService;
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
        String subject = String.format("Invitation à rejoindre %s sur Seyrura", tenantName);
        String htmlContent = buildInvitationEmailHtml(tenantName, inviteLink, inviterName, message);
        String textContent = buildInvitationEmailText(tenantName, inviteLink, inviterName, message);
        sendEmail(toEmail, subject, htmlContent, textContent);
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
        String subject = String.format("Bienvenue dans %s sur Seyrura", tenantName);
        String htmlContent = buildWelcomeEmailHtml(tenantName, userName);
        String textContent = buildWelcomeEmailText(tenantName, userName);
        sendEmail(toEmail, subject, htmlContent, textContent);
    }
    
    @Override
    public void sendEmail(
        String toEmail,
        String subject,
        String htmlContent,
        String textContent
    ) {
        try {
            Email from = new Email(fromAddress, fromName);
            Email to = new Email(toEmail);
            
            Content content = new Content("text/html", htmlContent);
            Mail mail = new Mail(from, subject, to, content);
            
            // Add plain text alternative if provided
            if (textContent != null && !textContent.isBlank()) {
                Content text = new Content("text/plain", textContent);
                mail.addContent(text);
            }
            
            Request request = new Request();
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            
            Response response = sendGrid.api(request);
            
            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                log.info("Email sent successfully to {}: {}", toEmail, subject);
            } else {
                log.error("Failed to send email to {}: {} - {}",
                    toEmail, response.getStatusCode(), response.getBody());
                throw new EmailException(
                    String.format("Failed to send email: %d - %s", 
                        response.getStatusCode(), response.getBody())
                );
            }
        } catch (IOException e) {
            log.error("Error sending email to {}", toEmail, e);
            throw new EmailException("Failed to send email", e);
        }
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
            Email from = new Email(fromAddress, fromName);
            Content content = new Content("text/html", htmlContent != null ? htmlContent : "");
            Mail mail = new Mail(from, subject, new Email(to.get(0)), content);
            com.sendgrid.helpers.mail.objects.Personalization p = mail.getPersonalization().get(0);
            for (int i = 1; i < to.size(); i++) {
                p.addTo(new Email(to.get(i)));
            }
            if (cc != null) {
                for (String c : cc) {
                    if (c != null && !c.isBlank()) p.addCc(new Email(c));
                }
            }
            if (textContent != null && !textContent.isBlank()) {
                mail.addContent(new Content("text/plain", textContent));
            }
            if (attachments != null) {
                for (EmailAttachment att : attachments) {
                    Attachments a = new Attachments();
                    a.setContent(Base64.getMimeEncoder().encodeToString(att.content()));
                    a.setType(att.mimeType());
                    a.setFilename(att.filename());
                    a.setDisposition("attachment");
                    mail.addAttachments(a);
                }
            }
            Request request = new Request();
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            Response response = sendGrid.api(request);
            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                log.info("Email sent successfully to {}: {}", to, subject);
            } else {
                log.error("Failed to send email: {} - {}", response.getStatusCode(), response.getBody());
                throw new EmailException(String.format("Failed to send email: %d - %s", response.getStatusCode(), response.getBody()));
            }
        } catch (IOException e) {
            log.error("Error sending email", e);
            throw new EmailException("Failed to send email", e);
        }
    }
    
    private String buildInvitationEmailHtml(
        String tenantName,
        String inviteLink,
        String inviterName,
        String message
    ) {
        String inviterText = inviterName != null && !inviterName.isBlank() 
            ? inviterName 
            : "Un administrateur";
        
        String messageHtml = message != null && !message.isBlank()
            ? String.format("<p style=\"margin: 20px 0; padding: 15px; background-color: #f0f0f0; border-left: 4px solid #1976d2; font-style: italic;\">%s</p>", 
                escapeHtml(message))
            : "";
        
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        line-height: 1.6; 
                        color: #333; 
                        margin: 0;
                        padding: 0;
                        background-color: #f5f5f5;
                    }
                    .container { 
                        max-width: 600px; 
                        margin: 0 auto; 
                        padding: 0;
                        background-color: #ffffff;
                    }
                    .header { 
                        background-color: #1976d2; 
                        color: white; 
                        padding: 30px 20px; 
                        text-align: center; 
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 28px;
                        font-weight: 600;
                    }
                    .content { 
                        padding: 30px 20px; 
                        background-color: #ffffff;
                    }
                    .content h2 {
                        color: #1976d2;
                        margin-top: 0;
                        font-size: 24px;
                    }
                    .button { 
                        display: inline-block; 
                        padding: 14px 28px; 
                        background-color: #1976d2; 
                        color: white; 
                        text-decoration: none; 
                        border-radius: 6px; 
                        margin: 20px 0;
                        font-weight: 600;
                        font-size: 16px;
                    }
                    .button:hover {
                        background-color: #1565c0;
                    }
                    .link-text {
                        word-break: break-all; 
                        color: #1976d2;
                        font-size: 12px;
                        margin-top: 10px;
                    }
                    .footer { 
                        text-align: center; 
                        padding: 20px; 
                        color: #666; 
                        font-size: 12px;
                        background-color: #f9f9f9;
                        border-top: 1px solid #e0e0e0;
                    }
                    .expiry-notice {
                        margin-top: 20px;
                        padding: 10px;
                        background-color: #fff3cd;
                        border-left: 4px solid #ffc107;
                        font-size: 14px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Seyrura</h1>
                    </div>
                    <div class="content">
                        <h2>Vous êtes invité(e) à rejoindre %s</h2>
                        <p>Bonjour,</p>
                        <p><strong>%s</strong> vous a invité(e) à rejoindre <strong>%s</strong> sur Seyrura.</p>
                        %s
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="%s" class="button">Accepter l'invitation</a>
                        </div>
                        <p style="text-align: center; color: #666; font-size: 14px;">
                            Ou copiez ce lien dans votre navigateur:
                        </p>
                        <p class="link-text">%s</p>
                        <div class="expiry-notice">
                            <strong>⏰ Cette invitation expire dans 7 jours.</strong>
                        </div>
                    </div>
                    <div class="footer">
                        <p>Cet email a été envoyé par Seyrura.</p>
                        <p>Si vous n'avez pas demandé cette invitation, vous pouvez l'ignorer en toute sécurité.</p>
                    </div>
                </div>
            </body>
            </html>
            """,
            tenantName,
            inviterText,
            tenantName,
            messageHtml,
            inviteLink,
            inviteLink
        );
    }
    
    private String buildInvitationEmailText(
        String tenantName,
        String inviteLink,
        String inviterName,
        String message
    ) {
        String inviterText = inviterName != null && !inviterName.isBlank() 
            ? inviterName 
            : "Un administrateur";
        
        String messageText = message != null && !message.isBlank()
            ? String.format("\n\nMessage:\n%s\n", message)
            : "";
        
        return String.format("""
            Vous êtes invité(e) à rejoindre %s
            
            Bonjour,
            
            %s vous a invité(e) à rejoindre %s sur Seyrura.
            %s
            Pour accepter cette invitation, cliquez sur le lien suivant ou copiez-le dans votre navigateur:
            
            %s
            
            ⏰ Cette invitation expire dans 7 jours.
            
            ---
            Cet email a été envoyé par Seyrura.
            Si vous n'avez pas demandé cette invitation, vous pouvez l'ignorer en toute sécurité.
            """,
            tenantName,
            inviterText,
            tenantName,
            messageText,
            inviteLink
        );
    }
    
    private String buildWelcomeEmailHtml(String tenantName, String userName) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #1976d2; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Bienvenue sur Seyrura</h1>
                    </div>
                    <div class="content">
                        <h2>Bienvenue %s !</h2>
                        <p>Votre compte a été activé avec succès dans <strong>%s</strong>.</p>
                        <p>Vous pouvez maintenant accéder à toutes les fonctionnalités de votre organisation.</p>
                    </div>
                </div>
            </body>
            </html>
            """,
            userName,
            tenantName
        );
    }
    
    private String buildWelcomeEmailText(String tenantName, String userName) {
        return String.format("""
            Bienvenue sur Seyrura
            
            Bonjour %s,
            
            Votre compte a été activé avec succès dans %s.
            Vous pouvez maintenant accéder à toutes les fonctionnalités de votre organisation.
            """,
            userName,
            tenantName
        );
    }
    
    private String escapeHtml(String text) {
        if (text == null) return "";
        return text
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#39;");
    }
}

