package ma.nafura.platform.framework.record;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.criteria.CommonAbstractCriteria;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.From;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * The one filter grammar: a property criterion, or {@code and} / {@code or} of criteria, two levels deep.
 * A relation is crossed once: {@code where} on a {@code relation} (N-1), {@code any} / {@code none} / {@code empty}
 * on {@code relations} (1-N), with a sub-filter on the target's filterable properties. The target is always
 * restricted to the organisation and needs its read permission (403 otherwise).
 * {@code me} and relative dates ({@code today}, {@code today±Nd}, {@code startOfMonth}) are resolved here.
 */
public final class RecordFilter {

    private static final ObjectMapper JSON = new ObjectMapper();
    private static final Pattern RELATIVE = Pattern.compile("today([+-])(\\d+)d");
    private static final int MAX_DEPTH = 2;

    private static final Map<String, Set<String>> OPERATORS = Map.of(
            "text", Set.of("is", "isNot", "contains", "startsWith", "empty"),
            "number", Set.of("eq", "ne", "gt", "gte", "lt", "lte", "between", "empty"),
            "money", Set.of("eq", "ne", "gt", "gte", "lt", "lte", "between", "empty"),
            "date", Set.of("is", "before", "after", "between", "empty"),
            "status", Set.of("is", "isNot", "in", "notIn"),
            "select", Set.of("is", "isNot", "in", "notIn"),
            "relation", Set.of("is", "in", "empty", "where"),
            "relations", Set.of("any", "none", "empty"),
            "person", Set.of("is", "in", "empty"),
            "boolean", Set.of("is"));

    /**
     * What a filter is resolved against: the organisation, the caller, the calendar day, and the other records
     * (to cross a relation) with the caller's right to read them. {@code external}: an external audience never
     * crosses a relation.
     */
    public record Context(UUID tenantId, UUID me, LocalDate today, ZoneId zone, boolean external,
                          Function<String, RecordCatalog.Target> targets, Predicate<String> canRead) {
    }

    private RecordFilter() {
    }

    public static <T> Specification<T> compile(String json, Map<String, RecordProperty> properties, Context context) {
        if (json == null || json.isBlank()) {
            return null;
        }
        JsonNode root;
        try {
            root = JSON.readTree(json);
        } catch (Exception e) {
            throw bad("Invalid filter");
        }
        if (root == null || root.isNull()) {
            return null;
        }
        if (!root.isObject()) {
            throw bad("Invalid filter");
        }
        Resolved resolved = resolve(root, properties, 0, false, context);
        ZoneId zone = context.zone() == null ? ZoneId.of("UTC") : context.zone();
        return (entity, query, cb) -> predicate(entity, query, cb, resolved, zone, context.tenantId());
    }

    /**
     * {@code q}: contains, case-insensitive, on the declared search paths. A path across a relation the caller
     * cannot read is skipped, never an error.
     */
    public static <T> Specification<T> search(String q, RecordDescriptor descriptor, Context context) {
        if (q == null || q.isBlank() || descriptor == null || descriptor.search().isEmpty()) {
            return null;
        }
        String like = "%" + q.trim().toLowerCase() + "%";
        return (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> any = new ArrayList<>();
            for (String path : descriptor.search()) {
                int dot = path.indexOf('.');
                if (dot < 0) {
                    any.add(cb.like(cb.lower(root.get(path).as(String.class)), like));
                    continue;
                }
                RecordProperty relation = descriptor.property(path.substring(0, dot));
                RecordCatalog.Target target = context.targets().apply(relation.target());
                if (context.external() || target == null || !context.canRead().test(relation.target())) continue;
                String field = path.substring(dot + 1);
                any.add(cb.exists(across(root, query, cb, relation, target, context.tenantId(),
                        to -> cb.like(cb.lower(to.get(field).as(String.class)), like))));
            }
            return any.isEmpty() ? cb.disjunction() : cb.or(any.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }

    private static Resolved resolve(JsonNode node, Map<String, RecordProperty> properties, int depth, boolean crossed, Context context) {
        boolean and = node.has("and");
        boolean or = node.has("or");
        if (and || or) {
            if (node.size() != 1) {
                throw bad("A filter group contains only and or or");
            }
            if (depth >= MAX_DEPTH) {
                throw bad("Filter is nested more than two levels deep");
            }
            JsonNode children = and ? node.get("and") : node.get("or");
            if (children == null || !children.isArray()) {
                throw bad("A filter group must be an array");
            }
            List<Resolved> items = new ArrayList<>();
            for (JsonNode child : children) {
                if (child == null || !child.isObject()) {
                    throw bad("Invalid filter");
                }
                items.add(resolve(child, properties, depth + 1, crossed, context));
            }
            return Resolved.group(and, items);
        }
        if (node.size() != 1) {
            throw bad("A filter criterion names one property");
        }
        Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
        Map.Entry<String, JsonNode> entry = fields.next();
        RecordProperty property = properties.get(entry.getKey());
        if (property == null) {
            throw bad("Unknown property " + entry.getKey());
        }
        if (!property.filterable()) {
            throw bad("Property " + entry.getKey() + " is not filterable");
        }
        JsonNode criterion = entry.getValue();
        if (criterion == null || !criterion.isObject() || criterion.size() != 1) {
            throw bad("Property " + entry.getKey() + " needs one operator");
        }
        Map.Entry<String, JsonNode> operator = criterion.fields().next();
        if (!OPERATORS.get(property.type()).contains(operator.getKey())) {
            throw bad("Operator " + operator.getKey() + " is not allowed on " + entry.getKey());
        }
        boolean crossing = "where".equals(operator.getKey()) || "any".equals(operator.getKey()) || "none".equals(operator.getKey())
                || ("relations".equals(property.type()) && "empty".equals(operator.getKey()));
        if (crossing) {
            return relation(property, operator.getKey(), operator.getValue(), crossed, context);
        }
        Object value = resolveValue(property, operator.getKey(), operator.getValue(), context);
        return Resolved.leaf(entry.getKey(), property.type(), operator.getKey(), value);
    }

    private static Resolved relation(RecordProperty property, String operator, JsonNode raw, boolean crossed, Context context) {
        if (crossed) {
            throw bad("A filter crosses one relation only: " + property.key());
        }
        if (context.external() || !context.canRead().test(property.target())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot filter on " + property.target());
        }
        RecordCatalog.Target target = context.targets().apply(property.target());
        if (target == null) {
            throw bad("Unknown relation target " + property.target());
        }
        if ("empty".equals(operator)) {
            if (!raw.isBoolean()) {
                throw bad("Operator empty expects true or false");
            }
            return Resolved.across(property, target, operator, null, raw.booleanValue());
        }
        if (raw == null || !raw.isObject()) {
            throw bad("Operator " + operator + " expects a filter on " + property.target());
        }
        Resolved sub = resolve(raw, target.descriptor().properties(), 0, true, context);
        return Resolved.across(property, target, operator, sub, null);
    }

    private static Object resolveValue(RecordProperty property, String operator, JsonNode raw, Context context) {
        if ("empty".equals(operator)) {
            if (!raw.isBoolean()) {
                throw bad("Operator empty expects true or false");
            }
            return raw.booleanValue();
        }
        if ("between".equals(operator)) {
            if (!raw.isArray() || raw.size() != 2) {
                throw bad("Operator between expects two values");
            }
            return List.of(scalar(property, raw.get(0), context), scalar(property, raw.get(1), context));
        }
        if ("in".equals(operator) || "notIn".equals(operator)) {
            if (!raw.isArray() || raw.isEmpty()) {
                throw bad("Operator " + operator + " expects a list of values");
            }
            List<Object> values = new ArrayList<>();
            raw.forEach(item -> values.add(scalar(property, item, context)));
            return values;
        }
        return scalar(property, raw, context);
    }

    private static Object scalar(RecordProperty property, JsonNode raw, Context context) {
        if (raw == null || raw.isNull()) {
            throw bad("A filter value is required");
        }
        String text = raw.isTextual() ? raw.asText() : raw.isBoolean() ? Boolean.toString(raw.booleanValue()) : raw.asText();
        if ("me".equals(text) && ("person".equals(property.type()) || "relation".equals(property.type()))) {
            if (context.me() == null) {
                throw bad("No current user for me");
            }
            return context.me();
        }
        return switch (property.type()) {
            case "number", "money" -> number(raw);
            case "date" -> date(text, context.today());
            case "boolean" -> raw.isBoolean() ? raw.booleanValue() : Boolean.valueOf(text);
            case "person", "relation" -> uuid(text);
            default -> text;
        };
    }

    static LocalDate date(String raw, LocalDate today) {
        if (raw == null || raw.isBlank()) {
            throw bad("Invalid date");
        }
        if ("today".equals(raw)) {
            return today;
        }
        if ("startOfMonth".equals(raw)) {
            return today.withDayOfMonth(1);
        }
        Matcher matcher = RELATIVE.matcher(raw);
        if (matcher.matches()) {
            int days = Integer.parseInt(matcher.group(2));
            return "+".equals(matcher.group(1)) ? today.plusDays(days) : today.minusDays(days);
        }
        try {
            return LocalDate.parse(raw);
        } catch (Exception e) {
            throw bad("Invalid date: " + raw);
        }
    }

    private static BigDecimal number(JsonNode raw) {
        try {
            return raw.isNumber() ? raw.decimalValue() : new BigDecimal(raw.asText());
        } catch (Exception e) {
            throw bad("Invalid number: " + raw.asText());
        }
    }

    private static UUID uuid(String raw) {
        try {
            return UUID.fromString(raw);
        } catch (Exception e) {
            throw bad("Invalid value: " + raw);
        }
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private static jakarta.persistence.criteria.Predicate predicate(
            From<?, ?> root, CommonAbstractCriteria query, CriteriaBuilder cb, Resolved resolved, ZoneId zone, UUID tenantId) {
        if (resolved.group) {
            jakarta.persistence.criteria.Predicate[] children = resolved.children.stream()
                    .map(child -> predicate(root, query, cb, child, zone, tenantId))
                    .toArray(jakarta.persistence.criteria.Predicate[]::new);
            if (children.length == 0) {
                return cb.conjunction();
            }
            return resolved.and ? cb.and(children) : cb.or(children);
        }
        if (resolved.target != null) {
            Subquery<?> linked = across(root, query, cb, resolved.relation, resolved.target, tenantId,
                    to -> resolved.sub == null ? cb.conjunction() : predicate(to, query, cb, resolved.sub, zone, tenantId));
            return switch (resolved.operator) {
                case "none" -> cb.not(cb.exists(linked));
                case "empty" -> Boolean.TRUE.equals(resolved.value) ? cb.not(cb.exists(linked)) : cb.exists(linked);
                default -> cb.exists(linked);
            };
        }
        Path path = root.get(resolved.field);
        Class<?> javaType = path.getJavaType();
        return switch (resolved.operator) {
            case "empty" -> Boolean.TRUE.equals(resolved.value)
                    ? empty(cb, path, "text".equals(resolved.type))
                    : notEmpty(cb, path, "text".equals(resolved.type));
            case "is", "eq" -> equal(cb, path, resolved, javaType, zone);
            case "isNot", "ne" -> cb.notEqual(path, typed(resolved.value, javaType, resolved.type));
            case "contains" -> cb.like(cb.lower(path.as(String.class)), "%" + String.valueOf(resolved.value).toLowerCase() + "%");
            case "startsWith" -> cb.like(cb.lower(path.as(String.class)), String.valueOf(resolved.value).toLowerCase() + "%");
            case "gt" -> cb.greaterThan(path, (Comparable) typed(resolved.value, javaType, resolved.type));
            case "gte" -> cb.greaterThanOrEqualTo(path, (Comparable) typed(resolved.value, javaType, resolved.type));
            case "lt", "before" -> before(cb, path, resolved, javaType, zone);
            case "lte" -> cb.lessThanOrEqualTo(path, (Comparable) typed(resolved.value, javaType, resolved.type));
            case "after" -> after(cb, path, resolved, javaType, zone);
            case "between" -> between(cb, path, resolved, javaType, zone);
            case "in" -> path.in((List<?>) resolved.value);
            case "notIn" -> cb.not(path.in((List<?>) resolved.value));
            default -> throw bad("Operator " + resolved.operator + " is not allowed on " + resolved.field);
        };
    }

    /**
     * The target records linked to {@code root} through {@code relation}, in the same organisation:
     * N-1 {@code target.id = root.<field>}, 1-N {@code target.<via> = root.id}.
     */
    private static Subquery<UUID> across(From<?, ?> root, CommonAbstractCriteria query, CriteriaBuilder cb, RecordProperty relation,
                                         RecordCatalog.Target target, UUID tenantId,
                                         Function<Root<?>, jakarta.persistence.criteria.Predicate> condition) {
        Subquery<UUID> linked = query.subquery(UUID.class);
        Root<?> to = linked.from(target.descriptor().type());
        jakarta.persistence.criteria.Predicate link = "relations".equals(relation.type())
                ? cb.equal(to.get(relation.via()), root.get("id"))
                : cb.equal(to.get("id"), root.get(relation.key()));
        linked.select(to.get("id")).where(link, cb.equal(to.get("tenantId"), tenantId), condition.apply(to));
        return linked;
    }

    private static jakarta.persistence.criteria.Predicate equal(CriteriaBuilder cb, Path<?> path, Resolved resolved, Class<?> javaType, ZoneId zone) {
        if ("date".equals(resolved.type) && javaType != LocalDate.class) {
            LocalDate day = (LocalDate) resolved.value;
            return cb.and(
                    cb.greaterThanOrEqualTo(path.as(OffsetDateTime.class), start(day, zone)),
                    cb.lessThan(path.as(OffsetDateTime.class), start(day.plusDays(1), zone)));
        }
        return cb.equal(path, typed(resolved.value, javaType, resolved.type));
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private static jakarta.persistence.criteria.Predicate before(CriteriaBuilder cb, Path path, Resolved resolved, Class<?> javaType, ZoneId zone) {
        if ("date".equals(resolved.type) && javaType != LocalDate.class) {
            return cb.lessThan(path.as(OffsetDateTime.class), start((LocalDate) resolved.value, zone));
        }
        return cb.lessThan(path, (Comparable) typed(resolved.value, javaType, resolved.type));
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private static jakarta.persistence.criteria.Predicate after(CriteriaBuilder cb, Path path, Resolved resolved, Class<?> javaType, ZoneId zone) {
        if ("date".equals(resolved.type) && javaType != LocalDate.class) {
            return cb.greaterThanOrEqualTo(path.as(OffsetDateTime.class), start(((LocalDate) resolved.value).plusDays(1), zone));
        }
        return cb.greaterThan(path, (Comparable) typed(resolved.value, javaType, resolved.type));
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private static jakarta.persistence.criteria.Predicate between(CriteriaBuilder cb, Path path, Resolved resolved, Class<?> javaType, ZoneId zone) {
        List<?> bounds = (List<?>) resolved.value;
        if ("date".equals(resolved.type) && javaType != LocalDate.class) {
            LocalDate from = (LocalDate) bounds.get(0);
            LocalDate to = (LocalDate) bounds.get(1);
            return cb.and(
                    cb.greaterThanOrEqualTo(path.as(OffsetDateTime.class), start(from, zone)),
                    cb.lessThan(path.as(OffsetDateTime.class), start(to.plusDays(1), zone)));
        }
        return cb.and(
                cb.greaterThanOrEqualTo(path, (Comparable) typed(bounds.get(0), javaType, resolved.type)),
                cb.lessThanOrEqualTo(path, (Comparable) typed(bounds.get(1), javaType, resolved.type)));
    }

    private static jakarta.persistence.criteria.Predicate empty(CriteriaBuilder cb, Path<?> path, boolean text) {
        return text
                ? cb.or(cb.isNull(path), cb.equal(cb.trim(path.as(String.class)), ""))
                : cb.isNull(path);
    }

    private static jakarta.persistence.criteria.Predicate notEmpty(CriteriaBuilder cb, Path<?> path, boolean text) {
        return text
                ? cb.and(cb.isNotNull(path), cb.notEqual(cb.trim(path.as(String.class)), ""))
                : cb.isNotNull(path);
    }

    private static Object typed(Object value, Class<?> javaType, String propertyType) {
        if (value == null) {
            return null;
        }
        if ("number".equals(propertyType) || "money".equals(propertyType)) {
            BigDecimal number = value instanceof BigDecimal decimal ? decimal : new BigDecimal(value.toString());
            if (javaType == Integer.class || javaType == int.class) return number.intValue();
            if (javaType == Long.class || javaType == long.class) return number.longValue();
            if (javaType == Double.class || javaType == double.class) return number.doubleValue();
            if (javaType == Float.class || javaType == float.class) return number.floatValue();
            if (javaType == Short.class || javaType == short.class) return number.shortValue();
            return number;
        }
        return value;
    }

    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private static final class Resolved {
        private final boolean group;
        private final boolean and;
        private final List<Resolved> children;
        private final String field;
        private final String type;
        private final String operator;
        private final Object value;
        private final RecordProperty relation;
        private final RecordCatalog.Target target;
        private final Resolved sub;

        private Resolved(boolean group, boolean and, List<Resolved> children, String field, String type, String operator,
                         Object value, RecordProperty relation, RecordCatalog.Target target, Resolved sub) {
            this.group = group;
            this.and = and;
            this.children = children;
            this.field = field;
            this.type = type;
            this.operator = operator;
            this.value = value;
            this.relation = relation;
            this.target = target;
            this.sub = sub;
        }

        static Resolved group(boolean and, List<Resolved> children) {
            return new Resolved(true, and, children, null, null, null, null, null, null, null);
        }

        static Resolved leaf(String field, String type, String operator, Object value) {
            return new Resolved(false, false, List.of(), field, type, operator, value, null, null, null);
        }

        static Resolved across(RecordProperty relation, RecordCatalog.Target target, String operator, Resolved sub, Object value) {
            return new Resolved(false, false, List.of(), relation.key(), relation.type(), operator, value, relation, target, sub);
        }
    }

    /** Exposed for tests that pin the calendar day. */
    public static LocalDate resolveDate(String raw, LocalDate today) {
        return date(raw, today);
    }

    private static OffsetDateTime start(LocalDate day, ZoneId zone) {
        return day.atStartOfDay(zone).toOffsetDateTime();
    }
}
