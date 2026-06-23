package ma.nafura.platform.framework.context;

import java.util.Collections;
import java.util.Set;
import java.util.UUID;

/**
 * Thread-local context holder for user-level security information.
 */
public class UserContext {

    private static final ThreadLocal<Set<String>> PERMISSIONS = new ThreadLocal<>();
    private static final ThreadLocal<Boolean> IS_SUPER_ADMIN = new ThreadLocal<>();
    private static final ThreadLocal<String> USER_EMAIL = new ThreadLocal<>();
    private static final ThreadLocal<String> USER_ROLE = new ThreadLocal<>();
    private static final ThreadLocal<UUID> USER_ID = new ThreadLocal<>();

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
        if (isSuperAdmin()) {
            return true;
        }

        Set<String> userPermissions = getPermissions();
        if (userPermissions.contains(permission)) {
            return true;
        }

        for (String userPerm : userPermissions) {
            if (matchesWildcard(permission, userPerm)) {
                return true;
            }
        }

        return false;
    }

    private static boolean matchesWildcard(String permission, String pattern) {
        if ("*".equals(pattern)) {
            return true;
        }

        if (pattern.endsWith(".*")) {
            String prefix = pattern.substring(0, pattern.length() - 2);
            return permission.startsWith(prefix + ".");
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
    }

    public static String getUserRole() {
        return USER_ROLE.get();
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
        USER_ID.remove();
    }
}

