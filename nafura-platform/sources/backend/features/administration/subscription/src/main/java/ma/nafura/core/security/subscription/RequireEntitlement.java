package ma.nafura.platform.subscription.security.subscription;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Requires a subscription entitlement for the annotated endpoint (or controller).
 *
 * <p>Entitlement keys should follow CRUX scope naming where possible:
 * <code>{domain}.{feature}.{resource}.{action}</code>.
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireEntitlement {

    /**
     * Entitlement key to evaluate.
     */
    String value();

    /**
     * Entitlement ownership scope resolution strategy.
     */
    EntitlementOwner owner() default EntitlementOwner.AUTO;

    /**
     * If true, SUPER_ADMIN bypasses entitlement checks.
     */
    boolean allowSuperAdmin() default true;
}

