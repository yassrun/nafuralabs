package ma.nafura.platform.framework.autonumber;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks an entity as auto-numbered using a configured numbering sequence.
 * The target field is populated on persist when empty (if onlyIfEmpty is true).
 * <p>
 * Also add {@code @EntityListeners(AutoNumberEntityListener.class)} to the entity class
 * so that the listener runs on persist.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface AutoNumbered {

    /** Numbering sequence code (must match a configured sequence). */
    String sequenceCode();

    /** Entity field to populate (default: "code"). */
    String field() default "code";

    /** Only assign if field is null/empty (default: true). */
    boolean onlyIfEmpty() default true;
}
