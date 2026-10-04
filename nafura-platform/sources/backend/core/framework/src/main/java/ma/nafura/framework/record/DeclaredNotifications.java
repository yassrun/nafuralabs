package ma.nafura.platform.framework.record;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Notification events declared by the business contexts on the classpath ({@code spec.notifications} of
 * {@code META-INF/nafura/bc/*.json}) and by the platform ({@code META-INF/nafura/platform/notifications.json},
 * prefix {@code platform.}). Same rules as the web validator: an id lives under its owner's prefix, a title,
 * at least one known channel. A declaration error fails at startup.
 */
public final class DeclaredNotifications {

    public static final Set<String> CHANNELS = Set.of("in_app", "email", "sms");

    private static final ObjectMapper JSON = new ObjectMapper();

    private DeclaredNotifications() {
    }

    /**
     * {@code title} may reference fields of the record or values given by the sender: {@code "Demande approuvée : {subject}"}.
     * {@code channels}: the defaults, before the organisation and the user. {@code mandatory}: the user cannot opt out.
     */
    public record Event(String id, String label, String title, Set<String> channels, boolean mandatory) {
    }

    public static Map<String, Event> load() {
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        List<String> problems = new ArrayList<>();
        Map<String, Event> events = new LinkedHashMap<>();
        try {
            for (Resource resource : resolver.getResources("classpath*:META-INF/nafura/bc/*.json")) {
                JsonNode manifest = JSON.readTree(resource.getInputStream());
                String contextId = manifest.path("metadata").path("id").asText();
                String namespace = contextId.substring(contextId.indexOf('.') + 1) + ".";
                read(manifest.path("spec").path("notifications"), contextId, namespace, events, problems);
            }
            for (Resource resource : resolver.getResources("classpath*:META-INF/nafura/platform/notifications.json")) {
                read(JSON.readTree(resource.getInputStream()).path("notifications"), "platform", "platform.", events, problems);
            }
        } catch (IOException e) {
            throw new IllegalStateException("Cannot read notification declarations", e);
        }
        if (!problems.isEmpty()) {
            throw new IllegalStateException("Invalid notification declarations:\n - " + String.join("\n - ", problems));
        }
        return Collections.unmodifiableMap(events);
    }

    private static void read(JsonNode declarations, String owner, String namespace, Map<String, Event> events, List<String> problems) {
        for (JsonNode node : declarations) {
            String id = node.path("id").asText("");
            if (!id.startsWith(namespace)) problems.add(owner + " declares notification " + id + " outside " + namespace);
            if (node.path("label").asText("").isBlank()) problems.add(id + ": a notification needs a label");
            if (node.path("title").asText("").isBlank()) problems.add(id + ": a notification needs a title");
            Set<String> channels = new LinkedHashSet<>();
            node.path("channels").forEach(channel -> channels.add(channel.asText()));
            if (channels.isEmpty()) problems.add(id + ": a notification needs at least one channel");
            channels.stream().filter(channel -> !CHANNELS.contains(channel))
                    .forEach(channel -> problems.add(id + ": unknown channel " + channel + " (" + String.join(", ", CHANNELS) + ")"));
            Event event = new Event(id, node.path("label").asText(), node.path("title").asText(),
                    Collections.unmodifiableSet(channels), node.path("mandatory").asBoolean(false));
            if (events.putIfAbsent(id, event) != null) problems.add("notification " + id + " declared twice");
        }
    }
}
