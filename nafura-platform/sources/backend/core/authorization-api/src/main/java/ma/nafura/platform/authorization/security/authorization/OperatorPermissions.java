package ma.nafura.platform.authorization.security.authorization;

import java.util.Collection;

/**
 * Product-operator permissions ({@code platform.operator.*}).
 * They are granted only by the deployment's operators list, never by a role wildcard
 * ({@code *} of OWNER, {@code platform.*} of ORG_ADMIN) and never by the super-admin flag.
 * A role that declares one of them prevents startup.
 */
public final class OperatorPermissions {

    public static final String PREFIX = "platform.operator";
    /** Explicit grant placed on the request of a deployment operator. Not a role wildcard. */
    public static final String ALL = "platform.operator.*";

    private OperatorPermissions() {
    }

    public static boolean isOperatorPermission(String permission) {
        return permission != null && (permission.equals(PREFIX) || permission.startsWith(PREFIX + "."));
    }

    /**
     * Role wildcards never cover an operator permission. {@code platform.operator.*} held on the
     * request is an explicit grant, matched by {@link #granted}, not by this method.
     */
    public static boolean coveredByWildcard(String permission, String pattern) {
        if (permission == null || pattern == null || isOperatorPermission(permission)) {
            return false;
        }
        if ("*".equals(pattern)) {
            return true;
        }
        if (pattern.endsWith(".*")) {
            String prefix = pattern.substring(0, pattern.length() - 2);
            return permission.startsWith(prefix + ".");
        }
        return false;
    }

    public static boolean granted(Collection<String> held, String permission) {
        if (!isOperatorPermission(permission) || held == null) {
            return false;
        }
        return held.contains(permission) || held.contains(ALL);
    }
}
