package ma.nafura.platform.authorization.security.authorization;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * The method is gated by the host record ({@code entityType} + id) instead of the controller resource,
 * when that entity was registered by a {@code RecordController}. Otherwise the usual permission applies.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface HostRecordGate {
}
