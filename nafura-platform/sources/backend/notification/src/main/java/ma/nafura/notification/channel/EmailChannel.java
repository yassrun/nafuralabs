package ma.nafura.platform.collaboration.notification.channel;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.collaboration.notification.service.EmailService;
import ma.nafura.platform.collaboration.notification.service.NotificationLinkResolver;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.repository.AppUserRepository;

/** A mail to the user's address; a failure is logged, never thrown back to the transaction that notified. */
@Component
@RequiredArgsConstructor
public class EmailChannel implements NotificationChannel {

    private static final Logger log = LoggerFactory.getLogger(EmailChannel.class);

    private final EmailService email;
    private final AppUserRepository users;
    private final NotificationLinkResolver links;

    @Override
    public String id() {
        return "email";
    }

    @Override
    public void deliver(Delivery delivery) {
        String address = users.findById(delivery.recipientId()).map(AppUser::getEmail).orElse(null);
        if (address == null || address.isBlank()) return;
        String title = delivery.title() == null ? "" : delivery.title();
        String summary = delivery.body() == null || delivery.body().isBlank() ? title : delivery.body();
        String href = links.absolute(delivery.actionUrl());
        StringBuilder html = new StringBuilder();
        html.append("<h2 style=\"font-size:1.1rem;margin:0 0 12px;\">")
                .append(HtmlUtils.htmlEscape(title))
                .append("</h2>");
        html.append("<p style=\"margin:0 0 16px;\">")
                .append(HtmlUtils.htmlEscape(summary))
                .append("</p>");
        if (href != null) {
            html.append("<p style=\"margin:0;\"><a href=\"")
                    .append(HtmlUtils.htmlEscape(href))
                    .append("\">Ouvrir</a></p>");
        }
        String text = href == null ? summary : summary + "\n\nOuvrir: " + href;
        try {
            email.sendEmail(address, title, html.toString(), text);
        } catch (RuntimeException e) {
            log.warn("Notification {} not mailed to {}: {}", delivery.event(), address, e.getMessage());
        }
    }
}
