package ma.nafura.platform.framework.audit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Opt-in audit trail. Persist / flush / delete of the annotated entity is recorded
 * by the platform audit feature (Postgres {@code audit_events}).
 *
 * <p>Keep {@link #trackedFields()} to identity + status + money/legal fields.
 * Timestamps ({@code createdAt}, {@code updatedAt}) must stay out — they change on every write.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface Auditable {

    /** Stable type key used by the journal and the timeline (e.g. {@code "facture-client"}). */
    String entityType();

    /** Fields to snapshot / diff. Supports dot notation (e.g. {@code "address.city"}). */
    String[] trackedFields() default {};
}
