package ma.nafura.platform.administration.iam.api.response.tenant;

import java.util.List;
import java.util.Locale;

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
    long memberCount,

    /**
     * Scope family: CHANTIER (affectable per site), ENTREPRISE (tenant-wide), BOTH.
     */
    String scopeType
) {

    public static RoleResponse fromRole(String role, List<String> permissions) {
        return fromRole(role, permissions, 0L);
    }

    public static RoleResponse fromRole(String role, List<String> permissions, long memberCount) {
        if (role == null) {
            return null;
        }

        String code = role.toUpperCase(Locale.ROOT);
        String scope = resolveScopeType(code);

        return switch (code) {
            case "SUPER_ADMIN" -> new RoleResponse(
                "SUPER_ADMIN",
                "Super Admin",
                "Platform-level administrator with full access to all tenants",
                permissions,
                true,
                1000,
                memberCount,
                scope
            );
            case "OWNER" -> new RoleResponse(
                "OWNER",
                "Owner",
                "Full control over the tenant and all its resources",
                permissions,
                true,
                100,
                memberCount,
                scope
            );
            case "ADMIN" -> new RoleResponse(
                "ADMIN",
                "Administrator",
                "Manage users and most tenant settings",
                permissions,
                true,
                80,
                memberCount,
                scope
            );
            case "MANAGER" -> new RoleResponse(
                "MANAGER",
                "Manager",
                "Manage day-to-day operations and team members",
                permissions,
                true,
                60,
                memberCount,
                scope
            );
            case "MEMBER" -> new RoleResponse(
                "MEMBER",
                "Member",
                "Standard user with basic access",
                permissions,
                true,
                40,
                memberCount,
                scope
            );
            case "VIEWER" -> new RoleResponse(
                "VIEWER",
                "Viewer",
                "Read-only access to resources",
                permissions,
                true,
                20,
                memberCount,
                scope
            );
            case "BTP_DG" -> new RoleResponse(
                "BTP_DG", "Direction générale", "BTP — Direction générale",
                permissions, true, 95, memberCount, scope);
            case "BTP_DAF" -> new RoleResponse(
                "BTP_DAF", "DAF", "BTP — Direction administrative et financière",
                permissions, true, 90, memberCount, scope);
            case "BTP_DIRECTEUR_TRAVAUX" -> new RoleResponse(
                "BTP_DIRECTEUR_TRAVAUX", "Directeur travaux", "BTP — Directeur travaux (multi-chantiers)",
                permissions, true, 75, memberCount, scope);
            case "BTP_CONDUCTEUR_TRAVAUX" -> new RoleResponse(
                "BTP_CONDUCTEUR_TRAVAUX", "Conducteur de travaux", "BTP — Conducteur de travaux",
                permissions, true, 70, memberCount, scope);
            case "BTP_CHEF_CHANTIER" -> new RoleResponse(
                "BTP_CHEF_CHANTIER", "Chef de chantier", "BTP — Chef de chantier",
                permissions, true, 55, memberCount, scope);
            case "BTP_CHEF_EQUIPE" -> new RoleResponse(
                "BTP_CHEF_EQUIPE", "Chef d'équipe", "BTP — Chef d'équipe",
                permissions, true, 45, memberCount, scope);
            case "BTP_MAGASINIER" -> new RoleResponse(
                "BTP_MAGASINIER", "Magasinier", "BTP — Magasinier",
                permissions, true, 35, memberCount, scope);
            case "BTP_POINTEUR" -> new RoleResponse(
                "BTP_POINTEUR", "Pointeur", "BTP — Pointeur",
                permissions, true, 30, memberCount, scope);
            case "BTP_INGENIEUR" -> new RoleResponse(
                "BTP_INGENIEUR", "Ingénieur", "BTP — Ingénieur chantier",
                permissions, true, 50, memberCount, scope);
            default -> new RoleResponse(
                code,
                role,
                "Custom role",
                permissions,
                false,
                10,
                memberCount,
                scope
            );
        };
    }

    public static String resolveScopeType(String roleCode) {
        if (roleCode == null) {
            return "ENTREPRISE";
        }
        return switch (roleCode.toUpperCase(Locale.ROOT)) {
            case "BTP_CONDUCTEUR_TRAVAUX", "BTP_CHEF_CHANTIER", "BTP_CHEF_EQUIPE", "BTP_INGENIEUR"
                    -> "CHANTIER";
            case "BTP_DIRECTEUR_TRAVAUX", "BTP_MAGASINIER", "BTP_POINTEUR"
                    -> "BOTH";
            default -> "ENTREPRISE";
        };
    }
}
