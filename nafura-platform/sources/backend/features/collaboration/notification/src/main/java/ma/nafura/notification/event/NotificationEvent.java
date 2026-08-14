package ma.nafura.platform.collaboration.notification.event;

import java.util.Map;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * Base application event for notifications, used by listeners to create
 * in-app notifications and optionally trigger email delivery.
 */
@Getter
public class NotificationEvent extends ApplicationEvent {

    private final UUID recipientId;
    private final String title;
    private final String body;
    private final String entityType;
    private final UUID entityId;
    private final String source;
    private final String actionUrl;
    private final Map<String, String> metadata;

    @Builder
    public NotificationEvent(
            Object sourceObject,
            UUID recipientId,
            String title,
            String body,
            String entityType,
            UUID entityId,
            String source,
            String actionUrl,
            Map<String, String> metadata
    ) {
        super(sourceObject);
        this.recipientId = recipientId;
        this.title = title;
        this.body = body;
        this.entityType = entityType;
        this.entityId = entityId;
        this.source = source;
        this.actionUrl = actionUrl;
        this.metadata = metadata;
    }
}

