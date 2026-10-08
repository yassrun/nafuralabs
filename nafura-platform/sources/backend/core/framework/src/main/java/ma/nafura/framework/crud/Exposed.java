package ma.nafura.platform.framework.crud;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks an entity for CRUD generation (legacy generator).
 *
 * @deprecated Héritage Sektor — supprimé avec sektor-sur-host. Utiliser {@link ma.nafura.platform.framework.record.RecordController}
 *             et un descripteur {@code records/*.json}.
 */
@Deprecated(since = "2026-10", forRemoval = true)
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface Exposed {
    
    /**
     * API path for REST controller.
     * Example: "/api/items"
     */
    String apiPath();
    
    /**
     * Product that exposes this entity.
     * Example: "agora", "doxura"
     */
    String product();
    
    /**
     * Generate Create/Update DTOs.
     * Default: true
     */
    boolean generateDto() default true;
    
    /**
     * Generate MapStruct mapper.
     * Default: true
     */
    boolean generateMapper() default true;
    
    /**
     * Generate service base class (xxxServiceBase).
     * Services use a wrapper pattern for safe regeneration.
     * Default: true
     */
    boolean generateService() default true;
    
    /**
     * Generate REST controller.
     * Default: true
     */
    boolean generateController() default true;
}

