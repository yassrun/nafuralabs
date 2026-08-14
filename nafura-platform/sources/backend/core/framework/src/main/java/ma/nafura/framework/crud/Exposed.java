package ma.nafura.platform.framework.crud;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks an entity for CRUD generation.
 * Entities with this annotation will get auto-generated:
 * - DTOs (Create/Update) - if generateDto = true
 * - MapStruct Mapper - if generateMapper = true
 * - Service (extending JpaCrudService) - if generateService = true
 * - REST Controller (extending CrudController) - if generateController = true
 *
 * Generated services use a base/wrapper pattern:
 * - xxxServiceBase: auto-generated base (always regenerated)
 * - xxxService: custom wrapper (generated once, never overwritten)
 *
 * Example:
 * <pre>
 * @Entity
 * @Exposed(apiPath = "/api/items", product = "agora")
 * public class Item { ... }
 *
 * @Entity
 * @Exposed(
 *     apiPath = "/api/countries",
 *     product = "agora",
 *     generateDto = false,
 *     generateService = true
 * )
 * public class Country { ... }
 * </pre>
 */
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

