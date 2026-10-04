package ma.nafura.platform.collaboration.notification.service;

import java.util.Collection;
import java.util.Map;

import org.springframework.stereotype.Component;

import ma.nafura.platform.framework.record.DeclaredNotifications;
import ma.nafura.platform.framework.record.DeclaredNotifications.Event;

/** The declared notification events, read once at startup (an invalid declaration stops it). */
@Component
public class NotificationEvents {

    private final Map<String, Event> declared = DeclaredNotifications.load();

    public Collection<Event> all() {
        return declared.values();
    }

    public Event require(String id) {
        Event event = declared.get(id);
        if (event == null) {
            throw new IllegalArgumentException("Notification non déclarée : " + id);
        }
        return event;
    }
}
