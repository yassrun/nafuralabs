package ma.nafura.platform.collaboration.notification.channel;

import java.util.UUID;

/**
 * A way to reach a user: {@code in_app}, {@code email}, {@code sms}. The router calls the channels the preferences
 * keep for an event; a declared channel without an implementation is skipped (warned once at startup).
 */
public interface NotificationChannel {

    String id();

    void deliver(Delivery delivery);

    /** {@code event}: the declared id; {@code title} is already filled with the record's values. */
    record Delivery(UUID tenantId, UUID recipientId, String event, String title, String body,
                    String entityType, UUID entityId, String actionUrl) {
    }
}
