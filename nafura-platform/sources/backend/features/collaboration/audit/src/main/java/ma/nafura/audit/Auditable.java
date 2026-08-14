package ma.nafura.platform.collaboration.audit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks an entity as audited by the CRUD framework.
 * When present, create/update/delete operations are automatically logged via {@link AuditService}.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface Auditable {

    /** Logical entity type for the audit log (e.g. "invoice", "item"). */
    String entityType();

    /** Fields to include in snapshots and diffs; supports dot notation (e.g. "address.city"). */
    String[] trackedFields() default {};
}
