package ma.nafura.platform.collaboration.notification.service;

import ma.nafura.platform.collaboration.notification.domain.model.Notification;
import ma.nafura.platform.collaboration.notification.event.NotificationEvent;
import org.springframework.stereotype.Component;

/**
 * Simple renderer for notification emails. For now this keeps things
 * intentionally minimal and can be evolved later to use templates.
 */
@Component
public class NotificationEmailRenderer {

    public record EmailContent(String subject, String htmlBody, String textBody) {}

    public EmailContent renderForNotification(Notification notification, NotificationEvent event) {
        String subject = notification.getTitle();
        StringBuilder textBody = new StringBuilder();
        if (notification.getBody() != null) {
            textBody.append(notification.getBody()).append("\n\n");
        }
        if (notification.getActionUrl() != null) {
            textBody.append("View in Nafura: ").append(notification.getActionUrl());
        }

        String htmlBody = "<p>" + escape(notification.getBody() != null ? notification.getBody() : "") + "</p>";
        if (notification.getActionUrl() != null) {
            htmlBody += "<p><a href=\"" + notification.getActionUrl() + "\">View in Nafura</a></p>";
        }

        return new EmailContent(subject, htmlBody, textBody.toString());
    }

    private String escape(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }
}

