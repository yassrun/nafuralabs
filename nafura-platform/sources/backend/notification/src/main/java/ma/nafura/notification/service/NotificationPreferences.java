package ma.nafura.platform.collaboration.notification.service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.collaboration.notification.domain.model.NotificationPreference;
import ma.nafura.platform.collaboration.notification.repository.NotificationPreferenceRepository;
import ma.nafura.platform.framework.record.DeclaredNotifications;
import ma.nafura.platform.framework.record.DeclaredNotifications.Event;

/**
 * Which channels an event goes through, in three layers: the manifest's defaults, then the organisation
 * (switches a channel off or adds one), then the user (switches off what the organisation keeps, unless the
 * event is mandatory; never adds a channel).
 */
@Service
@RequiredArgsConstructor
public class NotificationPreferences {

    private final NotificationPreferenceRepository preferences;
    private final NotificationEvents events;

    /** One event as a settings screen shows it: {@code channels} is the effective set at that layer. */
    public record Setting(String event, String label, boolean mandatory, Set<String> defaults,
                          Set<String> organisation, Set<String> channels) {
    }

    @Transactional(readOnly = true)
    public Set<String> channels(UUID tenantId, UUID userId, Event event) {
        Set<String> organisation = organisation(event, choices(preferences.findByTenantIdAndUserIdIsNull(tenantId)));
        return user(event, organisation, userId == null ? Map.of() : choices(preferences.findByTenantIdAndUserId(tenantId, userId)));
    }

    @Transactional(readOnly = true)
    public List<Setting> forOrganisation(UUID tenantId) {
        Map<String, Boolean> org = choices(preferences.findByTenantIdAndUserIdIsNull(tenantId));
        List<Setting> settings = new ArrayList<>();
        for (Event event : events.all()) {
            Set<String> channels = organisation(event, org);
            settings.add(new Setting(event.id(), event.label(), event.mandatory(), event.channels(), channels, channels));
        }
        return settings;
    }

    @Transactional(readOnly = true)
    public List<Setting> forUser(UUID tenantId, UUID userId) {
        Map<String, Boolean> org = choices(preferences.findByTenantIdAndUserIdIsNull(tenantId));
        Map<String, Boolean> mine = choices(preferences.findByTenantIdAndUserId(tenantId, userId));
        List<Setting> settings = new ArrayList<>();
        for (Event event : events.all()) {
            Set<String> organisation = organisation(event, org);
            settings.add(new Setting(event.id(), event.label(), event.mandatory(), event.channels(), organisation, user(event, organisation, mine)));
        }
        return settings;
    }

    @Transactional
    public void setForOrganisation(UUID tenantId, String eventId, String channel, boolean enabled) {
        events.require(eventId);
        requireChannel(channel);
        NotificationPreference row = preferences.findByTenantIdAndUserIdIsNullAndEventAndChannel(tenantId, eventId, channel)
                .orElseGet(() -> NotificationPreference.builder().tenantId(tenantId).event(eventId).channel(channel).build());
        row.setEnabled(enabled);
        preferences.save(row);
    }

    @Transactional
    public void setForUser(UUID tenantId, UUID userId, String eventId, String channel, boolean enabled) {
        Event event = events.require(eventId);
        requireChannel(channel);
        if (event.mandatory()) {
            throw new IllegalArgumentException("La notification " + eventId + " est obligatoire.");
        }
        NotificationPreference row = preferences.findByTenantIdAndUserIdAndEventAndChannel(tenantId, userId, eventId, channel)
                .orElseGet(() -> NotificationPreference.builder().tenantId(tenantId).userId(userId).event(eventId).channel(channel).build());
        row.setEnabled(enabled);
        preferences.save(row);
    }

    static Set<String> organisation(Event event, Map<String, Boolean> choices) {
        Set<String> channels = new LinkedHashSet<>();
        for (String channel : DeclaredNotifications.CHANNELS) {
            Boolean choice = choices.get(key(event.id(), channel));
            if (choice != null ? choice : event.channels().contains(channel)) channels.add(channel);
        }
        return channels;
    }

    static Set<String> user(Event event, Set<String> organisation, Map<String, Boolean> choices) {
        if (event.mandatory()) return organisation;
        return organisation.stream()
                .filter(channel -> !Boolean.FALSE.equals(choices.get(key(event.id(), channel))))
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private static Map<String, Boolean> choices(List<NotificationPreference> rows) {
        return rows.stream().collect(Collectors.toMap(row -> key(row.getEvent(), row.getChannel()), NotificationPreference::isEnabled, (a, b) -> b));
    }

    private static String key(String event, String channel) {
        return event + "|" + channel;
    }

    private static void requireChannel(String channel) {
        if (!DeclaredNotifications.CHANNELS.contains(channel)) {
            throw new IllegalArgumentException("Canal inconnu : " + channel);
        }
    }
}
