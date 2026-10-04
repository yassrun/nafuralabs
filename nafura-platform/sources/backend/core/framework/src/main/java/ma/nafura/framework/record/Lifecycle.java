package ma.nafura.platform.framework.record;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * The states of a record and the transitions between them, declared as JSON by a business context
 * (e.g. {@code lifecycle/purchase-request.json}). The platform enforces it: who may fire a transition,
 * from which states, which fields it requires, whether it needs an approval, and when the record may be edited.
 */
public record Lifecycle(
        String entity,
        String initial,
        List<String> editable,
        List<State> states,
        List<Transition> transitions) {

    /** {@code tone}: badge colour (default, info, success, warning, danger). */
    public record State(String id, String label, String tone) {
    }

    /**
     * {@code system}: fired by the platform only (approval outcome). {@code requires}: fields that must be filled.
     */
    public record Transition(
            String id,
            String label,
            List<String> from,
            String to,
            String permission,
            boolean system,
            List<String> requires,
            Approval approval,
            @JsonProperty("notify") List<Notify> notifications) {

        public boolean allowedFrom(String status) {
            return from != null && from.contains(status);
        }
    }

    /**
     * After the transition, an approval by {@code role} when {@code when} holds (e.g. {@code amount > 10000});
     * otherwise {@code approved} is fired at once. {@code title} may reference fields: {@code "Request {subject}"}.
     */
    public record Approval(String role, String when, String title, String approved, String rejected) {
    }

    /**
     * Who to tell after the transition. {@code event} is a notification declared by a business context manifest
     * (its title and default channels live there). {@code to} is {@code createdBy}, {@code field:<uuid field>}
     * or {@code permission:<id>} — never a role.
     */
    public record Notify(String event, String to) {
    }

    private static final ObjectMapper JSON = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    public static Lifecycle load(String classpathResource) {
        try (InputStream in = Thread.currentThread().getContextClassLoader().getResourceAsStream(classpathResource)) {
            if (in == null) {
                throw new IllegalStateException("Lifecycle not found on the classpath: " + classpathResource);
            }
            return JSON.readValue(in, Lifecycle.class).validated(classpathResource);
        } catch (IOException e) {
            throw new IllegalStateException("Unreadable lifecycle " + classpathResource, e);
        }
    }

    public Optional<Transition> transition(String id) {
        return transitions.stream().filter(t -> t.id().equals(id)).findFirst();
    }

    /** No {@code editable} list: always editable. */
    public boolean isEditable(String status) {
        return editable == null || editable.isEmpty() || editable.contains(status);
    }

    /** A declaration error fails at startup, not when a user clicks. */
    Lifecycle validated(String source) {
        Set<String> ids = new HashSet<>();
        states.forEach(s -> ids.add(s.id()));
        check(ids.contains(initial), source, "initial state " + initial + " is not declared");
        if (editable != null) {
            editable.forEach(s -> check(ids.contains(s), source, "editable state " + s + " is not declared"));
        }
        for (Transition t : transitions) {
            check(ids.contains(t.to()), source, t.id() + ": unknown target state " + t.to());
            t.from().forEach(s -> check(ids.contains(s), source, t.id() + ": unknown source state " + s));
            check(t.system() || (t.permission() != null && !t.permission().isBlank()), source,
                    t.id() + ": a user transition needs a permission");
            if (t.approval() != null) {
                check(t.approval().role() != null, source, t.id() + ": the approval needs a role");
                for (String outcome : new String[] {t.approval().approved(), t.approval().rejected()}) {
                    check(transition(outcome).isPresent(), source, t.id() + ": unknown approval outcome " + outcome);
                }
            }
            if (t.notifications() != null) {
                for (Notify notify : t.notifications()) {
                    check(notify.to() != null && !notify.to().isBlank(), source, t.id() + ": notify needs a recipient");
                    check(notify.event() != null && !notify.event().isBlank(), source, t.id() + ": notify needs an event");
                    String to = notify.to();
                    boolean ok = to.equals("createdBy") || to.startsWith("field:") || to.startsWith("permission:");
                    check(ok, source, t.id() + ": notify recipient must be createdBy, field:<name> or permission:<id>");
                    if (to.startsWith("field:")) {
                        check(to.length() > "field:".length(), source, t.id() + ": notify field is empty");
                    }
                    if (to.startsWith("permission:")) {
                        String permission = to.substring("permission:".length());
                        check(permission.chars().filter(ch -> ch == '.').count() >= 2, source, t.id() + ": notify permission is not an id");
                    }
                }
            }
        }
        return this;
    }

    private static void check(boolean condition, String source, String message) {
        if (!condition) {
            throw new IllegalStateException("Invalid lifecycle " + source + ": " + message);
        }
    }
}
