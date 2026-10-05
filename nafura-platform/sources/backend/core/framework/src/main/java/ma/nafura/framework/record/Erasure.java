package ma.nafura.platform.framework.record;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * What happens to this entity when its external owner asks to be forgotten.
 * DELETE is the default when the annotation is absent. RETAIN keeps the row with no external access
 * until {@code until} (an ISO-8601 duration, for a legal obligation).
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface Erasure {

    Policy value() default Policy.DELETE;

    /** Legal retention, only for {@link Policy#RETAIN}. Example: {@code P5Y}. */
    String until() default "";

    enum Policy {
        ANONYMIZE,
        DELETE,
        RETAIN
    }
}
