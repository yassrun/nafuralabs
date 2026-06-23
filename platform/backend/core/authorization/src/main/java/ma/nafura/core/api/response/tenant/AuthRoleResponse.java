package ma.nafura.platform.authorization.api.response.tenant;

import java.util.List;

/**
 * Auth-facing role response DTO for tenant membership listing.
 */
public record AuthRoleResponse(
    String id,
    String name,
    String description,
    List<String> permissions,
    boolean isSystem,
    int priority,
    long memberCount
) {
    public static AuthRoleResponse fromRole(String role, List<String> permissions) {
        return fromRole(role, permissions, 0L);
    }

    public static AuthRoleResponse fromRole(String role, List<String> permissions, long memberCount) {
        if (role == null) {
            return null;
        }

        return switch (role.toUpperCase()) {
            case "SUPER_ADMIN" -> new AuthRoleResponse("SUPER_ADMIN", "Super Admin",
                "Platform-level administrator with full access to all tenants", permissions, true, 1000, memberCount);
            case "OWNER" -> new AuthRoleResponse("OWNER", "Owner",
                "Full control over the tenant and all its resources", permissions, true, 100, memberCount);
            case "ADMIN" -> new AuthRoleResponse("ADMIN", "Administrator",
                "Manage users and most tenant settings", permissions, true, 80, memberCount);
            case "MANAGER" -> new AuthRoleResponse("MANAGER", "Manager",
                "Manage day-to-day operations and team members", permissions, true, 60, memberCount);
            case "MEMBER" -> new AuthRoleResponse("MEMBER", "Member",
                "Standard user with basic access", permissions, true, 40, memberCount);
            case "VIEWER" -> new AuthRoleResponse("VIEWER", "Viewer",
                "Read-only access to resources", permissions, true, 20, memberCount);
            default -> new AuthRoleResponse(role.toUpperCase(), role, "Custom role", permissions, false, 10, memberCount);
        };
    }
}

