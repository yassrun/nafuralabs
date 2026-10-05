package ma.nafura.platform.framework.record;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * The field that holds the external owner's user id. Without it, the record has no external owner.
 * Never falls back to {@code createdBy}.
 */
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface OwnedBy {
}
