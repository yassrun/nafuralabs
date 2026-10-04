package ma.nafura.platform.collaboration.notification.service;

import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeanWrapperImpl;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import ma.nafura.platform.collaboration.notification.channel.NotificationChannel;
import ma.nafura.platform.collaboration.notification.channel.NotificationChannel.Delivery;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.record.DeclaredNotifications.Event;

/**
 * The one way to notify: a declared event for a recipient → the channels the preferences keep → each channel.
 * The title is the declaration's, filled with {@code {field}} from {@code values} (a record or a map).
 */
@Service
public class NotificationRouter {

    private static final Logger log = LoggerFactory.getLogger(NotificationRouter.class);
    private static final Pattern PLACEHOLDER = Pattern.compile("\\{([A-Za-z0-9_]+)}");

    private final NotificationEvents events;
    private final NotificationPreferences preferences;
    private final Map<String, NotificationChannel> channels;

    public NotificationRouter(NotificationEvents events, NotificationPreferences preferences, java.util.List<NotificationChannel> channels) {
        this.events = events;
        this.preferences = preferences;
        this.channels = channels.stream().collect(Collectors.toMap(NotificationChannel::id, Function.identity()));
    }

    /** What is sent: {@code body} and {@code actionUrl} are optional. */
    public record Message(String event, UUID recipientId, Object values, String body,
                          String entityType, UUID entityId, String actionUrl) {

        public static Message of(String event, UUID recipientId, Object values) {
            return new Message(event, recipientId, values, null, null, null, null);
        }

        public Message about(String entityType, UUID entityId) {
            return new Message(event, recipientId, values, body, entityType, entityId, actionUrl);
        }

        public Message body(String body) {
            return new Message(event, recipientId, values, body, entityType, entityId, actionUrl);
        }

        public Message link(String actionUrl) {
            return new Message(event, recipientId, values, body, entityType, entityId, actionUrl);
        }
    }

    @PostConstruct
    void warnMissingChannels() {
        Set<String> missing = new TreeSet<>();
        events.all().forEach(event -> event.channels().stream().filter(c -> !channels.containsKey(c)).forEach(missing::add));
        if (!missing.isEmpty()) {
            log.warn("Notification channels declared but not available, skipped: {}", missing);
        }
    }

    public void send(Message message) {
        if (message.recipientId() == null) return;
        Event event = events.require(message.event());
        UUID tenantId = TenantContext.getTenantId();
        Delivery delivery = new Delivery(tenantId, message.recipientId(), event.id(), fill(event.title(), message.values()),
                message.body(), message.entityType(), message.entityId(), message.actionUrl());
        for (String channel : preferences.channels(tenantId, message.recipientId(), event)) {
            NotificationChannel target = channels.get(channel);
            if (target != null) target.deliver(delivery);
        }
    }

    static String fill(String template, Object values) {
        Matcher m = PLACEHOLDER.matcher(template);
        BeanWrapperImpl bean = values == null || values instanceof Map ? null : new BeanWrapperImpl(values);
        StringBuilder out = new StringBuilder();
        while (m.find()) {
            String name = m.group(1);
            Object value = values instanceof Map<?, ?> map ? map.get(name)
                    : bean != null && bean.isReadableProperty(name) ? bean.getPropertyValue(name) : null;
            m.appendReplacement(out, Matcher.quoteReplacement(value == null ? "" : value.toString()));
        }
        m.appendTail(out);
        return out.toString();
    }
}
