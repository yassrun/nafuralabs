package ma.nafura.platform.authorization.security.authorization;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * A field leaves the organization only when it carries this annotation. Everything else stays hidden,
 * including audit fields. Distinct from a confidential record, which is withheld whole ({@link Confidential}).
 */
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface PublicField {
}
