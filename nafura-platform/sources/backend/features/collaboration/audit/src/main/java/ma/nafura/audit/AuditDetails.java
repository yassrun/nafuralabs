package ma.nafura.platform.collaboration.audit;

import java.util.List;
import java.util.Map;

/**
 * Human-readable one-liners stored on {@code audit_events.details}.
 */
public final class AuditDetails {

    private AuditDetails() {}

    public static String created(String entityType, Object entity, String[] fields) {
        return "Created " + entityType + " " + firstTracked(entity, fields);
    }

    public static String deleted(String entityType, Object entity, String[] fields) {
        return "Deleted " + entityType + " " + firstTracked(entity, fields);
    }

    @SuppressWarnings("unchecked")
    public static String updated(
            String entityType,
            Object entity,
            Map<String, Object> beforeSnapshot,
            Map<String, Object> payload) {
        Object changesObj = payload != null ? payload.get("changes") : null;
        if (changesObj instanceof List<?> changes && !changes.isEmpty()) {
            Object first = changes.get(0);
            if (first instanceof Map<?, ?> m) {
                Object field = m.get("field");
                Object from = m.get("from");
                Object to = m.get("to");
                if (field != null && (from != null || to != null)) {
                    return "Updated " + entityType + " " + field + " from " + from + " to " + to;
                }
            }
        }
        String[] keys = beforeSnapshot != null
                ? beforeSnapshot.keySet().toArray(new String[0])
                : new String[0];
        return "Updated " + entityType + " " + firstTracked(entity, keys);
    }

    @SuppressWarnings("unchecked")
    public static String statusChanged(String entityType, Map<String, Object> payload) {
        Object changesObj = payload != null ? payload.get("changes") : null;
        if (changesObj instanceof List<?> changes && !changes.isEmpty()) {
            Object first = changes.get(0);
            if (first instanceof Map<?, ?> m) {
                Object from = m.get("from");
                Object to = m.get("to");
                return "Status of " + entityType + " from " + from + " to " + to;
            }
        }
        return "Status of " + entityType + " changed";
    }

    private static String firstTracked(Object entity, String[] fields) {
        if (fields == null) {
            return "—";
        }
        for (String field : fields) {
            Object v = AuditPayloadBuilder.getValue(entity, field);
            if (v != null && !v.toString().isBlank()) {
                return v.toString();
            }
        }
        return "—";
    }
}
