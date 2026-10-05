package ma.nafura.platform.authorization.security.authorization;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * The boolean field that marks a record confidential. A condition of the record, not a public field.
 * While it is true, the record is withheld whole from non-members: absent from public lists, 404 by id.
 */
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Confidential {
}
