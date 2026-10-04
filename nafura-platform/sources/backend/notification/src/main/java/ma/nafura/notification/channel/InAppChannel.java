package ma.nafura.platform.collaboration.notification.channel;

import java.time.OffsetDateTime;
import java.util.Map;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.collaboration.notification.domain.model.Notification;
import ma.nafura.platform.collaboration.notification.inapp.NotificationStreamService;
import ma.nafura.platform.collaboration.notification.repository.NotificationRepository;

/** The bell: stored, then pushed to the user's open sessions. */
@Component
@RequiredArgsConstructor
public class InAppChannel implements NotificationChannel {

    private final NotificationRepository notifications;
    private final NotificationStreamService stream;

    @Override
    public String id() {
        return "in_app";
    }

    @Override
    public void deliver(Delivery delivery) {
        Notification saved = notifications.save(Notification.builder()
                .tenantId(delivery.tenantId())
                .recipientId(delivery.recipientId())
                .title(delivery.title().length() > 200 ? delivery.title().substring(0, 200) : delivery.title())
                .body(delivery.body())
                .channel(id())
                .entityType(delivery.entityType())
                .entityId(delivery.entityId())
                .source(delivery.event())
                .actionUrl(delivery.actionUrl())
                .isRead(false)
                .sentAt(OffsetDateTime.now())
                .build());
        stream.pushToUser(saved.getTenantId(), saved.getRecipientId(), Map.of(
                "type", "new_notification",
                "id", saved.getId().toString(),
                "title", saved.getTitle(),
                "source", delivery.event()));
        stream.pushRefresh(saved.getTenantId(), saved.getRecipientId(), "notification");
    }
}
