package ma.nafura.platform.framework.record;

import java.beans.PropertyDescriptor;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.BeanUtils;

/**
 * The single description of a record ({@code records/<record>.json}): its properties, the fields searched by
 * {@code q}, and its lifecycle when it has one. A declaration that does not match the entity fails at startup,
 * naming the file and the property; relation targets and search paths are checked by {@link RecordCatalog}.
 */
public record RecordDescriptor(
        String source,
        String entity,
        Class<?> type,
        Map<String, RecordProperty> properties,
        List<String> search,
        Lifecycle lifecycle) {

    private static final ObjectMapper JSON = new ObjectMapper();
    private static final Set<String> TYPES = Set.of(
            "text", "number", "money", "date", "boolean", "status", "select", "relation", "relations", "person");

    public static RecordDescriptor load(String classpathResource, Class<?> recordType) {
        try (InputStream in = Thread.currentThread().getContextClassLoader().getResourceAsStream(classpathResource)) {
            if (in == null) {
                throw new IllegalStateException("Record descriptor not found on the classpath: " + classpathResource);
            }
            return parse(classpathResource, JSON.readTree(in), recordType);
        } catch (IOException e) {
            throw new IllegalStateException("Unreadable record descriptor " + classpathResource, e);
        }
    }

    static RecordDescriptor parse(String source, JsonNode root, Class<?> recordType) {
        if (root == null || !root.isObject()) {
            throw new IllegalStateException("Invalid record " + source + ": the descriptor must be an object");
        }
        String entity = text(root, "entity");
        Map<String, Class<?>> fields = fields(recordType);
        JsonNode declared = root.get("properties");
        Map<String, RecordProperty> properties = new LinkedHashMap<>();
        if (declared != null && !declared.isNull()) {
            if (!declared.isObject()) {
                throw new IllegalStateException("Invalid record " + source + ": properties must be an object");
            }
            declared.fields().forEachRemaining(entry -> properties.put(entry.getKey(), property(source, entry.getKey(), entry.getValue(), fields)));
        }
        List<String> search = new ArrayList<>();
        JsonNode declaredSearch = root.get("search");
        if (declaredSearch != null && !declaredSearch.isNull()) {
            if (!declaredSearch.isArray()) {
                throw new IllegalStateException("Invalid record " + source + ": search must be an array");
            }
            for (JsonNode item : declaredSearch) {
                String path = item.asText();
                String head = path.contains(".") ? path.substring(0, path.indexOf('.')) : path;
                boolean relationPath = path.contains(".") && properties.containsKey(head) && properties.get(head).isRelation();
                if (!relationPath && (path.contains(".") || !fields.containsKey(path) || !CharSequence.class.isAssignableFrom(fields.get(path)))) {
                    throw new IllegalStateException("Invalid record " + source + ": search " + path + ": not a text field nor <relation>.<property>");
                }
                search.add(path);
            }
        }
        Lifecycle lifecycle = null;
        if (root.hasNonNull("states") || root.hasNonNull("initial") || root.hasNonNull("transitions")) {
            ObjectNode copy = ((ObjectNode) root).deepCopy();
            copy.remove("properties");
            copy.remove("search");
            try {
                lifecycle = JSON.treeToValue(copy, Lifecycle.class).validated(source);
            } catch (IOException e) {
                throw new IllegalStateException("Invalid record " + source + ": unreadable lifecycle", e);
            } catch (IllegalStateException e) {
                throw e;
            }
        }
        return new RecordDescriptor(source, entity, recordType, properties, List.copyOf(search), lifecycle);
    }

    public RecordProperty property(String key) {
        return properties.get(key);
    }

    private static RecordProperty property(String source, String key, JsonNode node, Map<String, Class<?>> fields) {
        if (node != null && "relations".equals(text(node, "type"))) {
            return relations(source, key, node);
        }
        if (!fields.containsKey(key)) {
            throw new IllegalStateException("Invalid record " + source + ": property " + key + ": no such field");
        }
        if (node == null || !node.isObject()) {
            throw new IllegalStateException("Invalid record " + source + ": property " + key + ": must be an object");
        }
        String label = text(node, "label");
        if (label == null || label.isBlank()) {
            throw new IllegalStateException("Invalid record " + source + ": property " + key + ": label is required");
        }
        String declared = text(node, "type");
        String type;
        try {
            type = declared == null || declared.isBlank() ? infer(key, fields.get(key)) : declared;
        } catch (IllegalStateException e) {
            throw new IllegalStateException("Invalid record " + source + ": property " + key + ": type cannot be inferred");
        }
        if (!TYPES.contains(type)) {
            throw new IllegalStateException("Invalid record " + source + ": property " + key + ": unknown type " + type);
        }
        if (!compatible(type, key, fields.get(key))) {
            throw new IllegalStateException("Invalid record " + source + ": property " + key + ": type " + type + " is incompatible with " + fields.get(key).getSimpleName());
        }
        String target = text(node, "target");
        String display = text(node, "display");
        if ("relation".equals(type)) {
            if (target == null || target.isBlank()) {
                throw new IllegalStateException("Invalid record " + source + ": property " + key + ": a relation needs a target");
            }
            if (display != null && !fields.containsKey(display)) {
                throw new IllegalStateException("Invalid record " + source + ": property " + key + ": no such display field " + display);
            }
        }
        List<String> options = new ArrayList<>();
        JsonNode rawOptions = node.get("options");
        if (rawOptions != null && rawOptions.isArray()) {
            rawOptions.forEach(item -> options.add(item.asText()));
        }
        String currency = text(node, "currency");
        if (currency != null && !"money".equals(type)) {
            throw new IllegalStateException("Invalid record " + source + ": property " + key + ": only a money has a currency");
        }
        return new RecordProperty(key, label, type, bool(node, "filterable"), bool(node, "sortable"), target, display, null, currency, List.copyOf(options));
    }

    /** 1-N: no field of its own; {@code via} is the field of the target pointing back (checked by the catalog). */
    private static RecordProperty relations(String source, String key, JsonNode node) {
        String label = text(node, "label");
        String target = text(node, "target");
        String via = text(node, "via");
        if (label == null || label.isBlank()) {
            throw new IllegalStateException("Invalid record " + source + ": property " + key + ": label is required");
        }
        if (target == null || target.isBlank() || via == null || via.isBlank()) {
            throw new IllegalStateException("Invalid record " + source + ": property " + key + ": relations need a target and a via field");
        }
        if (bool(node, "sortable")) {
            throw new IllegalStateException("Invalid record " + source + ": property " + key + ": relations cannot be sorted");
        }
        return new RecordProperty(key, label, "relations", bool(node, "filterable"), false, target, null, via, null, List.of());
    }

    /** Property type of a Java field of the record, if any (for a target's {@code via}). */
    public Class<?> fieldType(String name) {
        return fields(type).get(name);
    }

    static String infer(String name, Class<?> type) {
        if ("status".equals(name) && CharSequence.class.isAssignableFrom(type)) {
            return "status";
        }
        if (CharSequence.class.isAssignableFrom(type)) {
            return "text";
        }
        if (isNumber(type)) {
            return "number";
        }
        if (isDate(type)) {
            return "date";
        }
        if (type == Boolean.class || type == boolean.class) {
            return "boolean";
        }
        throw new IllegalStateException("type cannot be inferred");
    }

    private static boolean compatible(String type, String name, Class<?> field) {
        return switch (type) {
            case "text", "select" -> CharSequence.class.isAssignableFrom(field);
            case "status" -> "status".equals(name) && CharSequence.class.isAssignableFrom(field);
            case "number", "money" -> isNumber(field);
            case "date" -> isDate(field);
            case "boolean" -> field == Boolean.class || field == boolean.class;
            case "relation", "person" -> field == UUID.class;
            default -> false;
        };
    }

    private static boolean isNumber(Class<?> type) {
        return type == BigDecimal.class || type == BigInteger.class
                || type == Integer.class || type == int.class
                || type == Long.class || type == long.class
                || type == Double.class || type == double.class
                || type == Float.class || type == float.class
                || type == Short.class || type == short.class
                || type == Byte.class || type == byte.class;
    }

    private static boolean isDate(Class<?> type) {
        return type == LocalDate.class || type == LocalDateTime.class || type == OffsetDateTime.class
                || type == ZonedDateTime.class || type == Instant.class || type == Date.class;
    }

    private static Map<String, Class<?>> fields(Class<?> recordType) {
        Map<String, Class<?>> fields = new LinkedHashMap<>();
        if (recordType == null) {
            return fields;
        }
        for (PropertyDescriptor descriptor : BeanUtils.getPropertyDescriptors(recordType)) {
            if (descriptor.getReadMethod() != null && !"class".equals(descriptor.getName())) {
                fields.put(descriptor.getName(), descriptor.getPropertyType());
            }
        }
        return fields;
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value == null || value.isNull() ? null : value.asText();
    }

    private static boolean bool(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value != null && value.asBoolean(false);
    }
}
