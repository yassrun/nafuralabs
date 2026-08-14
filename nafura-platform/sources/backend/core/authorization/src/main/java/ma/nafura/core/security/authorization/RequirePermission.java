package ma.nafura.platform.authorization.security.authorization;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Overrides the default action derived from HTTP method for a specific endpoint.
 * 
 * Use this for non-standard operations that don't fit CRUD conventions.
 * 
 * Example:
 * <pre>
 * {@code
 * @RestController
 * @RequestMapping("/api/items")
 * @SecuredResource(domain = "inventory", feature = "stock", resource = "items")
 * public class ItemController {
 *     
 *     // Standard CRUD - uses convention
 *     @GetMapping  // → inventory.items.read
 *     public List<Item> list() { }
 *     
 *     // Special operation - explicit permission
 *     @PatchMapping("/{id}/status")
 *     @RequirePermission("change_status")  // → inventory.stock.items.change_status
 *     public Item changeStatus() { }
 *     
 *     // Reuse existing permission
 *     @PostMapping("/{id}/duplicate")
 *     @RequirePermission("create")  // → inventory.stock.items.create
 *     public Item duplicate() { }
 *     
 *     // Full permission override (bypass module.resource prefix)
 *     @GetMapping("/admin/stats")
 *     @RequirePermission(value = "tenant.admin.access", fullPermission = true)
 *     public Stats getStats() { }
 * }
 * }
 * </pre>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequirePermission {
    
    /**
     * The action name (e.g., "change_status", "export", "import").
     * Combined with domain.feature.resource (preferred) or module.resource (legacy)
     * from @SecuredResource to form full permission.
     * 
     * If fullPermission=true, this is treated as the complete permission string.
     */
    String value();
    
    /**
     * If true, the value is treated as a complete permission string
     * (e.g., "tenant.admin.access") instead of just the action part.
     */
    boolean fullPermission() default false;
}

