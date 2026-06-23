package ma.nafura.platform.collaboration.audit;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Builds audit payloads with field-level diffs and snapshots.
 * Supports nested fields via dot notation (e.g. {@code address.city}).
 */
public final class AuditPayloadBuilder {

    private AuditPayloadBuilder() {}

    private static final String CHANGES = "changes";
    private static final String SNAPSHOT = "snapshot";

    /**
     * Compute field-level changes between two states.
     * Skips unchanged values. Supports nested fields with dot notation.
     *
     * @param before previous state (entity or Map of field names to values)
     * @param after  current state (entity or Map)
     * @param fields field names (or paths like {@code address.city})
     * @return payload map with key {@code "changes"} containing list of {@code { field, from, to }}
     */
    @SuppressWarnings("unchecked")
    public static Map<String, Object> changes(Object before, Object after, String... fields) {
        Map<String, Object> payload = new HashMap<>();
        List<Map<String, Object>> changeList = new ArrayList<>();
        for (String field : fields) {
            if (field == null || field.isBlank()) continue;
            Object fromVal = getValue(before, field);
            Object toVal = getValue(after, field);
            if (Objects.equals(fromVal, toVal)) continue;
            Map<String, Object> entry = new HashMap<>();
            entry.put("field", field);
            entry.put("from", fromVal);
            entry.put("to", toVal);
            changeList.add(entry);
        }
        payload.put(CHANGES, changeList);
        return payload;
    }

    /**
     * Snapshot of specified fields from an entity (for before/after or payloads).
     */
    public static Map<String, Object> snapshot(Object entity, String... fields) {
        Map<String, Object> map = new HashMap<>();
        for (String field : fields) {
            if (field == null || field.isBlank()) continue;
            Object value = getValue(entity, field);
            map.put(field, value);
        }
        return map;
    }

    /**
     * Payload for create: snapshot of key fields.
     */
    public static Map<String, Object> created(Object entity, String... fields) {
        Map<String, Object> payload = new HashMap<>();
        payload.put(SNAPSHOT, snapshot(entity, fields));
        return payload;
    }

    /**
     * Payload for delete: snapshot of key fields.
     */
    public static Map<String, Object> deleted(Object entity, String... fields) {
        Map<String, Object> payload = new HashMap<>();
        payload.put(SNAPSHOT, snapshot(entity, fields));
        return payload;
    }

    /**
     * Read a property from an object, supporting dot notation for nested paths.
     * If {@code obj} is a Map, the path is used as key (only first segment for nested).
     */
    @SuppressWarnings("unchecked")
    public static Object getValue(Object obj, String path) {
        if (obj == null || path == null || path.isBlank()) return null;
        String[] parts = path.split("\\.", -1);
        Object current = obj;
        for (String part : parts) {
            if (current == null) return null;
            String segment = part.trim();
            if (segment.isEmpty()) return null;
            if (current instanceof Map) {
                current = ((Map<String, ?>) current).get(segment);
                continue;
            }
            current = readProperty(current, segment);
        }
        return current;
    }

    private static Object readProperty(Object entity, String property) {
        if (entity == null || property == null || property.isBlank()) return null;
        Class<?> type = entity.getClass();
        String suffix = property.substring(0, 1).toUpperCase() + property.substring(1);
        for (String methodName : List.of("get" + suffix, "is" + suffix, property)) {
            try {
                Method method = type.getMethod(methodName);
                if (method.getParameterCount() == 0) {
                    return method.invoke(entity);
                }
            } catch (Exception ignored) {
                // continue
            }
        }
        while (type != null) {
            try {
                Field field = type.getDeclaredField(property);
                field.setAccessible(true);
                return field.get(entity);
            } catch (Exception ignored) {
                type = type.getSuperclass();
            }
        }
        return null;
    }
}
