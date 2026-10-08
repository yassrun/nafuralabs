package ma.nafura.platform.framework.scope;

import java.util.UUID;

import org.springframework.data.jpa.domain.Specification;

/**
 * A membership role applies to the whole organisation. A grant applies that role to one scope node
 * and its descendants. Callers that already hold the permission on the organisation are not narrowed.
 */
public interface DataScope {

    /** The caller holds the permission on the organisation (role, wildcard, super-admin). */
    boolean unrestricted(String permission);

    /**
     * The caller may enter this controller: organisation-wide permission, or the record is scoped and
     * some grant's role includes the permission. Row visibility is a separate check.
     */
    boolean admits(String permission, Class<?> controller);

    /** The permission is held organisation-wide, or by any grant. Used to cross a relation. */
    boolean granted(String permission);

    /** Extra list predicate. {@code null} when the record is not scoped or the caller is unrestricted. */
    <T> Specification<T> restriction(String entity, String permission);

    /** This row is inside the caller's scope for the permission. Unscoped records are visible. */
    boolean visible(String entity, UUID id, Object record, String permission);

    /** A create or update stays inside the caller's scope. Unscoped records and unrestricted callers pass. */
    void assertPlaced(String entity, Object record, String permission);
}
