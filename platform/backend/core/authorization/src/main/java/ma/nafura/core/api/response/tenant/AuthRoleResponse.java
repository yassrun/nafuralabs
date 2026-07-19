package ma.nafura.platform.authorization.api.response.tenant;

import java.util.List;
import java.util.Locale;

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
            case "BTP_DG" -> new AuthRoleResponse("BTP_DG", "Direction générale",
                "BTP — Direction générale", permissions, true, 95, memberCount, scope);
            case "BTP_DAF" -> new AuthRoleResponse("BTP_DAF", "DAF",
                "BTP — DAF", permissions, true, 90, memberCount, scope);
            case "BTP_DIRECTEUR_TRAVAUX" -> new AuthRoleResponse("BTP_DIRECTEUR_TRAVAUX", "Directeur travaux",
                "BTP — Directeur travaux", permissions, true, 75, memberCount, scope);
            case "BTP_CONDUCTEUR_TRAVAUX" -> new AuthRoleResponse("BTP_CONDUCTEUR_TRAVAUX", "Conducteur de travaux",
                "BTP — Conducteur de travaux", permissions, true, 70, memberCount, scope);
            case "BTP_CHEF_CHANTIER" -> new AuthRoleResponse("BTP_CHEF_CHANTIER", "Chef de chantier",
                "BTP — Chef de chantier", permissions, true, 55, memberCount, scope);
            case "BTP_CHEF_EQUIPE" -> new AuthRoleResponse("BTP_CHEF_EQUIPE", "Chef d'équipe",
                "BTP — Chef d'équipe", permissions, true, 45, memberCount, scope);
            case "BTP_MAGASINIER" -> new AuthRoleResponse("BTP_MAGASINIER", "Magasinier",
                "BTP — Magasinier", permissions, true, 35, memberCount, scope);
            case "BTP_POINTEUR" -> new AuthRoleResponse("BTP_POINTEUR", "Pointeur",
                "BTP — Pointeur", permissions, true, 30, memberCount, scope);
            case "BTP_INGENIEUR" -> new AuthRoleResponse("BTP_INGENIEUR", "Ingénieur",
                "BTP — Ingénieur", permissions, true, 50, memberCount, scope);
            default -> new AuthRoleResponse(code, role, "Custom role",
                permissions, false, 10, memberCount, scope);
        };
    }

    static String resolveScopeType(String roleCode) {
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
