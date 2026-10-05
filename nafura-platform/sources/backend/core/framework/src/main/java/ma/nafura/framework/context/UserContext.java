package ma.nafura.platform.framework.context;

import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

import ma.nafura.platform.authorization.security.authorization.OperatorPermissions;

/**
 * Thread-local context holder for user-level security information.
 */
public class UserContext {

    private static final ThreadLocal<Set<String>> PERMISSIONS = new ThreadLocal<>();
    private static final ThreadLocal<Boolean> IS_SUPER_ADMIN = new ThreadLocal<>();
    private static final ThreadLocal<String> USER_EMAIL = new ThreadLocal<>();
    private static final ThreadLocal<String> USER_ROLE = new ThreadLocal<>();
    private static final ThreadLocal<Set<String>> USER_ROLES = new ThreadLocal<>();
    private static final ThreadLocal<UUID> USER_ID = new ThreadLocal<>();
    private static final ThreadLocal<String> AUDIENCE = new ThreadLocal<>();

    private UserContext() {
        // Utility class
    }

    public static void setPermissions(Set<String> permissions) {
        PERMISSIONS.set(permissions != null ? permissions : Collections.emptySet());
    }

    public static Set<String> getPermissions() {
        Set<String> perms = PERMISSIONS.get();
        return perms != null ? perms : Collections.emptySet();
    }

    public static boolean hasPermission(String permission) {
        if (OperatorPermissions.isOperatorPermission(permission)) {
            return OperatorPermissions.granted(getPermissions(), permission);
        }
        if (isSuperAdmin()) {
            return true;
        }

        Set<String> userPermissions = getPermissions();
        if (userPermissions.contains(permission)) {
            return true;
        }

        for (String userPerm : userPermissions) {
            if (OperatorPermissions.coveredByWildcard(permission, userPerm)) {
                return true;
            }
        }

        return false;
    }

    public static void setSuperAdmin(boolean superAdmin) {
        IS_SUPER_ADMIN.set(superAdmin);
    }

    public static boolean isSuperAdmin() {
        Boolean isSuper = IS_SUPER_ADMIN.get();
        return isSuper != null && isSuper;
    }

    public static void setUserEmail(String email) {
        USER_EMAIL.set(email);
    }

    public static String getUserEmail() {
        return USER_EMAIL.get();
    }

    public static void setUserRole(String role) {
        USER_ROLE.set(role);
        if (role == null || role.isBlank()) {
            USER_ROLES.set(Set.of());
        } else {
            USER_ROLES.set(Set.of(role.trim().toUpperCase()));
        }
    }

    public static void setUserRoles(Collection<String> roles) {
        if (roles == null || roles.isEmpty()) {
            USER_ROLE.set(null);
            USER_ROLES.set(Set.of());
            return;
        }
        LinkedHashSet<String> normalized = new LinkedHashSet<>();
        for (String role : roles) {
            if (role != null && !role.isBlank()) {
                normalized.add(role.trim().toUpperCase());
            }
        }
        USER_ROLES.set(Set.copyOf(normalized));
        String primary = null;
        if (normalized.contains("SUPER_ADMIN")) {
            primary = "SUPER_ADMIN";
        } else if (normalized.contains("OWNER")) {
            primary = "OWNER";
        } else if (!normalized.isEmpty()) {
            primary = normalized.iterator().next();
        }
        USER_ROLE.set(primary);
    }

    public static String getUserRole() {
        return USER_ROLE.get();
    }

    public static Set<String> getUserRoles() {
        Set<String> roles = USER_ROLES.get();
        return roles != null ? roles : Collections.emptySet();
    }

    public static boolean hasRole(String role) {
        if (role == null || role.isBlank()) {
            return false;
        }
        if (getUserRoles().contains(role.trim().toUpperCase())) {
            return true;
        }
        String primary = getUserRole();
        return primary != null && primary.equalsIgnoreCase(role);
    }

    /** Tenant OWNER — lab / PME : peut trancher une approbation sans être l'approbateur N+1. */
    public static boolean isTenantOwner() {
        return hasRole("OWNER");
    }

    /** Mode B QA owner is provisioned as SUPER_ADMIN; treat as owner for lab four-eyes bypass. */
    public static boolean isOwnerOrSuperAdmin() {
        return isSuperAdmin() || isTenantOwner();
    }

    /** Audience of the active membership. {@code members} when none was chosen. */
    public static void setAudience(String audience) {
        AUDIENCE.set(audience == null || audience.isBlank() ? "members" : audience);
    }

    public static String getAudience() {
        String audience = AUDIENCE.get();
        return audience == null || audience.isBlank() ? "members" : audience;
    }

    public static void setUserId(UUID userId) {
        USER_ID.set(userId);
    }

    public static UUID getUserIdOrNull() {
        return USER_ID.get();
    }

    public static UUID getUserId() {
        UUID userId = USER_ID.get();
        if (userId == null) {
            throw new IllegalStateException("User context ID is not set for the current request");
        }
        return userId;
    }

    public static void clear() {
        PERMISSIONS.remove();
        IS_SUPER_ADMIN.remove();
        USER_EMAIL.remove();
        USER_ROLE.remove();
        USER_ROLES.remove();
        USER_ID.remove();
        AUDIENCE.remove();
    }
}

