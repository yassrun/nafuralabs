package ma.nafura.platform.collaboration.notification.service;

import java.util.List;

import ma.nafura.platform.collaboration.notification.domain.model.Notification;
import org.springframework.stereotype.Component;

/**
 * Minimal digest email renderer. This can later be replaced with a full
 * template-based implementation.
 */
@Component
public class DigestEmailRenderer {

    public record DigestEmailContent(String subject, String htmlBody, String textBody) {}

    public DigestEmailContent render(List<Notification> notifications) {
        String subject = "Your daily notification digest";

        StringBuilder text = new StringBuilder("Here's what happened since your last digest:\n\n");
        StringBuilder html = new StringBuilder("<p>Here's what happened since your last digest:</p><ul>");

        for (Notification n : notifications) {
            text.append("- ").append(n.getTitle()).append("\n");
            html.append("<li>").append(escape(n.getTitle())).append("</li>");
        }
        html.append("</ul>");

        text.append("\nManage your notification preferences in Settings.");
        html.append("<p>Manage your notification preferences in Settings.</p>");

        return new DigestEmailContent(subject, html.toString(), text.toString());
    }

    private String escape(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }
}

