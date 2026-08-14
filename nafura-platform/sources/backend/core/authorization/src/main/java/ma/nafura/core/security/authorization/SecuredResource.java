package ma.nafura.platform.authorization.security.authorization;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a controller as requiring permission checks for a specific domain/feature resource.
 * 
 * Permissions are automatically derived using one of these conventions:
 * - Preferred (CRUX): {domain}.{feature}.{resource}.{action}
 * - Legacy fallback: {module}.{resource}.{action}
 * 
 * Where action is derived from HTTP method:
 * - GET → read
 * - POST → create
 * - PUT/PATCH → update
 * - DELETE → delete
 * 
 * Example:
 * <pre>
 * {@code
 * @RestController
 * @RequestMapping("/api/items")
 * @SecuredResource(domain = "inventory", feature = "stock", resource = "items")
 * public class ItemController {
 *     
 *     @GetMapping  // → inventory.stock.items.read
 *     public List<Item> list() { }
 *     
 *     @PostMapping // → inventory.stock.items.create
 *     public Item create() { }
 * }
 * }
 * </pre>
 * 
 * For non-standard operations, use {@link RequirePermission} to override the action.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface SecuredResource {

    /**
     * CRUX domain identifier (preferred).
     */
    String domain() default "";

    /**
     * CRUX feature identifier (preferred).
     */
    String feature() default "";

    /**
     * Logical module/feature namespace (e.g., "inventory", "doc-extractor").
     * In CRUX-first mode this does not need a legacy module manifest.
     *
     * @deprecated Use {@link #domain()} + {@link #feature()}.
     */
    @Deprecated
    String module() default "";

    String resource();
}

