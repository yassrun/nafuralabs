package ma.nafura.platform.collaboration.notification.channel;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
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
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "new_notification");
        payload.put("id", saved.getId().toString());
        payload.put("title", saved.getTitle());
        payload.put("body", saved.getBody() != null ? saved.getBody() : "");
        payload.put("source", delivery.event());
        payload.put("actionUrl", delivery.actionUrl() != null ? delivery.actionUrl() : "");
        payload.put("entityType", delivery.entityType() != null ? delivery.entityType() : "");
        payload.put("entityId", delivery.entityId() != null ? delivery.entityId().toString() : "");
        payload.put("sentAt", saved.getSentAt().toString());
        payload.put("isRead", false);
        stream.pushToUser(saved.getTenantId(), saved.getRecipientId(), payload);
        stream.pushRefresh(saved.getTenantId(), saved.getRecipientId(), "notification");
    }
}
