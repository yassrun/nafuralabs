package ma.nafura.platform.framework.listing;

import jakarta.persistence.criteria.Path;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import ma.nafura.platform.framework.service.crud.Specs;
import org.springframework.data.jpa.domain.Specification;

/**
 * Builds JPA {@link Specification} instances from structured listing filters (AND-only).
 */
public final class ListingSpecificationBuilder {

    private static final Set<String> UUID_FIELDS = Set.of("createdBy", "updatedBy", "tenantId", "id");
    private static final Set<String> TEMPORAL_FIELDS = Set.of("createdAt", "updatedAt");

    private ListingSpecificationBuilder() {}

    public static <T> Specification<T> build(
            ListingQuery query,
            Set<String> allowedFields,
            UUID tenantId) {

        Specification<T> spec = Specification.where(null);

        if (tenantId != null) {
            spec = spec.and(Specs.equal("tenantId", tenantId));
        }

        if (query == null || query.filters().isEmpty() || allowedFields == null || allowedFields.isEmpty()) {
            return spec;
        }

        for (FilterClause clause : query.filters()) {
            if (!allowedFields.contains(clause.field())) {
                throw new ListingQueryException("Filter field not allowed: " + clause.field());
            }
            spec = spec.and(clauseToSpec(clause));
        }
        return spec;
    }

    private static <T> Specification<T> clauseToSpec(FilterClause clause) {
        String field = clause.field();
        FilterOperator op = clause.op();
        String raw = clause.rawValue();

        return switch (op) {
            case EQ -> Specs.equal(field, coerceScalar(field, raw));
            case NE -> Specs.notEqual(field, coerceScalar(field, raw));
            case CONTAINS -> Specs.contains(field, raw);
            case STARTS_WITH -> Specs.startsWith(field, raw);
            case GT -> comparableSpec(field, raw, ComparableOp.GT);
            case GTE -> comparableSpec(field, raw, ComparableOp.GTE);
            case LT -> comparableSpec(field, raw, ComparableOp.LT);
            case LTE -> comparableSpec(field, raw, ComparableOp.LTE);
            case IN -> {
                List<Object> values = Arrays.stream(raw.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .map(v -> coerceScalar(field, v))
                        .toList();
                if (values.isEmpty()) {
                    throw new ListingQueryException("IN filter requires at least one value for field " + field);
                }
                yield Specs.in(field, values);
            }
            case BETWEEN -> {
                String[] bounds = raw.split(",", 2);
                if (bounds.length < 2 || bounds[0].isBlank() || bounds[1].isBlank()) {
                    throw new ListingQueryException("BETWEEN filter requires two comma-separated values for field " + field);
                }
                Comparable<?> from = coerceComparable(field, bounds[0].trim());
                Comparable<?> to = coerceComparable(field, bounds[1].trim());
                yield between(field, from, to);
            }
            case IS_EMPTY -> (root, query, cb) -> cb.or(
                    cb.isNull(root.get(field)),
                    cb.equal(root.get(field).as(String.class), ""));
            case IS_NOT_EMPTY -> (root, query, cb) -> cb.and(
                    cb.isNotNull(root.get(field)),
                    cb.notEqual(root.get(field).as(String.class), ""));
        };
    }

    private enum ComparableOp {
        GT, GTE, LT, LTE
    }

    private static <T> Specification<T> comparableSpec(String field, String raw, ComparableOp op) {
        Comparable<?> value = coerceComparable(field, raw);
        return switch (op) {
            case GT -> Specs.greaterThan(field, value);
            case GTE -> Specs.greaterThanOrEqual(field, value);
            case LT -> Specs.lessThan(field, value);
            case LTE -> Specs.lessThanOrEqual(field, value);
        };
    }

    private static <T> Specification<T> between(String field, Comparable<?> from, Comparable<?> to) {
        return (root, query, cb) -> {
            Path<Comparable<Object>> path = root.get(field);
            return cb.and(
                    cb.greaterThanOrEqualTo(path, from),
                    cb.lessThanOrEqualTo(path, to));
        };
    }

    private static Object coerceScalar(String field, String raw) {
        if (UUID_FIELDS.contains(field)) {
            return UUID.fromString(raw);
        }
        if (TEMPORAL_FIELDS.contains(field)) {
            return OffsetDateTime.parse(raw);
        }
        return raw;
    }

    private static Comparable<?> coerceComparable(String field, String raw) {
        Object value = coerceScalar(field, raw);
        if (value instanceof Comparable<?> comparable) {
            return comparable;
        }
        throw new ListingQueryException("Field " + field + " does not support ordered comparison");
    }
}
