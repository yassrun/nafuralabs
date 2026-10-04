package ma.nafura.platform.collaboration.notification.channel;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.collaboration.notification.service.EmailService;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.repository.AppUserRepository;

/** A mail to the user's address; a failure is logged, never thrown back to the transaction that notified. */
@Component
@RequiredArgsConstructor
public class EmailChannel implements NotificationChannel {

    private static final Logger log = LoggerFactory.getLogger(EmailChannel.class);

    private final EmailService email;
    private final AppUserRepository users;

    @Override
    public String id() {
        return "email";
    }

    @Override
    public void deliver(Delivery delivery) {
        String address = users.findById(delivery.recipientId()).map(AppUser::getEmail).orElse(null);
        if (address == null || address.isBlank()) return;
        String text = delivery.body() == null || delivery.body().isBlank() ? delivery.title() : delivery.body();
        StringBuilder html = new StringBuilder("<p>").append(HtmlUtils.htmlEscape(text)).append("</p>");
        if (delivery.actionUrl() != null) {
            html.append("<p><a href=\"").append(HtmlUtils.htmlEscape(delivery.actionUrl())).append("\">Ouvrir</a></p>");
        }
        try {
            email.sendEmail(address, delivery.title(), html.toString(), text);
        } catch (RuntimeException e) {
            log.warn("Notification {} not mailed to {}: {}", delivery.event(), address, e.getMessage());
        }
    }
}
