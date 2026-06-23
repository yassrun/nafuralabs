package ma.nafura.platform.administration.iam.api.response.tenant;

import java.util.List;

/**
 * Role response DTO for tenant membership.
 * Represents a user's role within a tenant.
 */
public record RoleResponse(
    /** Unique role identifier (e.g., "OWNER", "ADMIN", "MEMBER") */
    String id,
    
    /** Human-readable role name */
    String name,
    
    /** Role description */
    String description,
    
    /** Permissions granted by this role */
    List<String> permissions,
    
    /** Is this a system-defined role (non-editable) */
    boolean isSystem,
    
    /** Role priority (higher = more privileged) */
    int priority,
    
    /** Number of members assigned to this role */
    long memberCount
) {
    
    /**
     * Create a RoleResponse from a role string (memberCount = 0).
     */
    public static RoleResponse fromRole(String role, List<String> permissions) {
        return fromRole(role, permissions, 0L);
    }
    
    /**
     * Create a RoleResponse from a role string with member count.
     * Maps standard roles to their full representation.
     */
    public static RoleResponse fromRole(String role, List<String> permissions, long memberCount) {
        if (role == null) {
            return null;
        }
        
        return switch (role.toUpperCase()) {
            case "SUPER_ADMIN" -> new RoleResponse(
                "SUPER_ADMIN",
                "Super Admin",
                "Platform-level administrator with full access to all tenants",
                permissions,
                true,
                1000,
                memberCount
            );
            case "OWNER" -> new RoleResponse(
                "OWNER",
                "Owner",
                "Full control over the tenant and all its resources",
                permissions,
                true,
                100,
                memberCount
            );
            case "ADMIN" -> new RoleResponse(
                "ADMIN",
                "Administrator",
                "Manage users and most tenant settings",
                permissions,
                true,
                80,
                memberCount
            );
            case "MANAGER" -> new RoleResponse(
                "MANAGER",
                "Manager",
                "Manage day-to-day operations and team members",
                permissions,
                true,
                60,
                memberCount
            );
            case "MEMBER" -> new RoleResponse(
                "MEMBER",
                "Member",
                "Standard user with basic access",
                permissions,
                true,
                40,
                memberCount
            );
            case "VIEWER" -> new RoleResponse(
                "VIEWER",
                "Viewer",
                "Read-only access to resources",
                permissions,
                true,
                20,
                memberCount
            );
            default -> new RoleResponse(
                role.toUpperCase(),
                role,
                "Custom role",
                permissions,
                false,
                10,
                memberCount
            );
        };
    }
}

