package ma.nafura.platform.collaboration.notification.inapp;

import ma.nafura.platform.collaboration.notification.domain.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * In-app notification service: send and list notifications for users.
 */
public interface NotificationService {

    Notification send(UUID userId, String channel, NotificationPayload payload);

    Page<Notification> listForCurrentUser(Pageable pageable);

    Page<Notification> listForCurrentUser(String source, Boolean isRead, OffsetDateTime from, OffsetDateTime to, Pageable pageable);

    long countUnreadForCurrentUser();

    void markRead(UUID notificationId);

    void markAllRead();

    void markReadBulk(Iterable<UUID> notificationIds);

    long deleteReadBefore(OffsetDateTime before);
}

