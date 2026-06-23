package ma.nafura.platform.collaboration.notification.inapp;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class NotificationPayload {
    private String title;
    private String body;
    private String entityType;
    private UUID entityId;
    private String actionUrl;
}

