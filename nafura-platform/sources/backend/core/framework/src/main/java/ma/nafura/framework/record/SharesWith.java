package ma.nafura.platform.framework.record;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * On the organization record that links to a person's record. Nothing is shared unless listed in {@link #fields()}.
 * The platform collects these at startup for the consent screen.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface SharesWith {

    /** Entity name of the person's record. */
    String entity();

    /** Field on this record that points at it. */
    String link();

    /** Explicit shared fields. Empty means nothing is shared. */
    String[] fields() default {};
}
