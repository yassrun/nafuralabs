package ma.nafura.platform.framework.service.crud;

import org.springframework.data.jpa.domain.Specification;

import java.util.Collection;

/**
 * Utility class for building common JPA Specifications.
 * Provides fluent API for constructing type-safe queries.
 * 
 * Example usage:
 * <pre>
 * import static ma.nafura.platform.framework.service.crud.Specs.*;
 * 
 * Specification<Item> spec = Specs.<Item>builder()
 *     .and(equal("type", ItemType.PRODUCT))
 *     .and(equal("isActive", true))
 *     .and(like("name", "%widget%"))
 *     .build();
 * 
 * List<Item> items = itemService.findByCriteria(spec, 0, 20);
 * </pre>
 */
public class Specs {

    /**
     * Create specification for equality match.
     */
    public static <T> Specification<T> equal(String field, Object value) {
        if (value == null) {
            return (root, query, cb) -> cb.isNull(root.get(field));
        }
        return (root, query, cb) -> cb.equal(root.get(field), value);
    }

    /**
     * Create specification for not equal.
     */
    public static <T> Specification<T> notEqual(String field, Object value) {
        if (value == null) {
            return (root, query, cb) -> cb.isNotNull(root.get(field));
        }
        return (root, query, cb) -> cb.notEqual(root.get(field), value);
    }

    /**
     * Create specification for LIKE match (case-insensitive).
     */
    public static <T> Specification<T> like(String field, String pattern) {
        return (root, query, cb) -> cb.like(cb.lower(root.get(field)), pattern.toLowerCase());
    }

    /**
     * Create specification for contains (case-insensitive).
     * Automatically adds wildcards.
     */
    public static <T> Specification<T> contains(String field, String value) {
        return like(field, "%" + value + "%");
    }

    /**
     * Create specification for starts with (case-insensitive).
     */
    public static <T> Specification<T> startsWith(String field, String value) {
        return like(field, value + "%");
    }

    /**
     * Create specification for IN clause.
     */
    public static <T> Specification<T> in(String field, Collection<?> values) {
        return (root, query, cb) -> root.get(field).in(values);
    }

    /**
     * Create specification for greater than.
     */
    public static <T> Specification<T> greaterThan(String field, Comparable<?> value) {
        return (root, query, cb) -> cb.greaterThan(root.get(field), (Comparable) value);
    }

    /**
     * Create specification for greater than or equal.
     */
    public static <T> Specification<T> greaterThanOrEqual(String field, Comparable<?> value) {
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get(field), (Comparable) value);
    }

    /**
     * Create specification for less than.
     */
    public static <T> Specification<T> lessThan(String field, Comparable<?> value) {
        return (root, query, cb) -> cb.lessThan(root.get(field), (Comparable) value);
    }

    /**
     * Create specification for less than or equal.
     */
    public static <T> Specification<T> lessThanOrEqual(String field, Comparable<?> value) {
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get(field), (Comparable) value);
    }

    /**
     * Create specification for null check.
     */
    public static <T> Specification<T> isNull(String field) {
        return (root, query, cb) -> cb.isNull(root.get(field));
    }

    /**
     * Create specification for not null check.
     */
    public static <T> Specification<T> isNotNull(String field) {
        return (root, query, cb) -> cb.isNotNull(root.get(field));
    }

    /**
     * Combine specifications with AND.
     */
    public static <T> Specification<T> and(Specification<T> spec1, Specification<T> spec2) {
        return Specification.where(spec1).and(spec2);
    }

    /**
     * Combine specifications with OR.
     */
    public static <T> Specification<T> or(Specification<T> spec1, Specification<T> spec2) {
        return Specification.where(spec1).or(spec2);
    }

    /**
     * Negate a specification.
     */
    public static <T> Specification<T> not(Specification<T> spec) {
        return Specification.not(spec);
    }

    /**
     * Start a specification builder.
     */
    public static <T> SpecBuilder<T> builder() {
        return new SpecBuilder<>();
    }

    /**
     * Fluent builder for composing specifications.
     */
    public static class SpecBuilder<T> {
        private Specification<T> spec = Specification.where(null);

        public SpecBuilder<T> and(Specification<T> other) {
            if (other != null) {
                spec = spec.and(other);
            }
            return this;
        }

        public SpecBuilder<T> or(Specification<T> other) {
            if (other != null) {
                spec = spec.or(other);
            }
            return this;
        }

        public Specification<T> build() {
            return spec;
        }
    }
}

