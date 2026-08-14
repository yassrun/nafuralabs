package ma.nafura.platform.authorization.security.authorization;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks an endpoint as public (no permission check required).
 * 
 * Use this for:
 * - Health check endpoints
 * - Public API endpoints
 * - Endpoints with their own authentication logic
 * 
 * Example:
 * <pre>
 * {@code
 * @RestController
 * @RequestMapping("/api/items")
 * @SecuredResource(domain = "inventory", feature = "stock", resource = "items")
 * public class ItemController {
 *     
 *     @GetMapping  // → Requires inventory.stock.items.read
 *     public List<Item> list() { }
 *     
 *     @GetMapping("/public/catalog")
 *     @PublicEndpoint  // → No permission check
 *     public List<Item> publicCatalog() { }
 * }
 * }
 * </pre>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface PublicEndpoint {
    
    /**
     * Optional reason for making this endpoint public.
     * Useful for documentation and audit purposes.
     */
    String reason() default "";
}

