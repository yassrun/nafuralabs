package ma.nafura.platform.authorization.api.response.tenant;

import java.util.List;
import java.util.Locale;

/**
 * Auth-facing role response DTO for tenant membership listing.
 * Product-specific roles fall through to the generic custom-role branch.
 */
public record AuthRoleResponse(
    String id,
    String name,
    String description,
    List<String> permissions,
    boolean isSystem,
    int priority,
    long memberCount,
    String scopeType
) {
    public static AuthRoleResponse fromRole(String role, List<String> permissions) {
        return fromRole(role, permissions, 0L);
    }

    public static AuthRoleResponse fromRole(String role, List<String> permissions, long memberCount) {
        if (role == null) {
            return null;
        }

        String code = role.toUpperCase(Locale.ROOT);
        String scope = resolveScopeType(code);

        return switch (code) {
            case "SUPER_ADMIN" -> new AuthRoleResponse("SUPER_ADMIN", "Super Admin",
                "Platform-level administrator with full access to all tenants",
                permissions, true, 1000, memberCount, scope);
            case "OWNER" -> new AuthRoleResponse("OWNER", "Owner",
                "Full control over the tenant and all its resources",
                permissions, true, 100, memberCount, scope);
            case "ADMIN" -> new AuthRoleResponse("ADMIN", "Administrator",
                "Manage users and most tenant settings",
                permissions, true, 80, memberCount, scope);
            case "MANAGER" -> new AuthRoleResponse("MANAGER", "Manager",
                "Manage day-to-day operations and team members",
                permissions, true, 60, memberCount, scope);
            case "MEMBER" -> new AuthRoleResponse("MEMBER", "Member",
                "Standard user with basic access",
                permissions, true, 40, memberCount, scope);
            case "VIEWER" -> new AuthRoleResponse("VIEWER", "Viewer",
                "Read-only access to resources",
                permissions, true, 20, memberCount, scope);
            default -> new AuthRoleResponse(code, humanize(code), "Custom role",
                permissions, false, 10, memberCount, scope);
        };
    }

    static String resolveScopeType(String roleCode) {
        return "ENTREPRISE";
    }

    private static String humanize(String code) {
        return code.replace('_', ' ').toLowerCase(Locale.ROOT);
    }
}
