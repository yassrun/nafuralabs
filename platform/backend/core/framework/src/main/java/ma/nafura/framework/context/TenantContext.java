package ma.nafura.platform.framework.context;

import java.util.UUID;

/**
 * Thread-local context holder for tenant information only.
 */
public class TenantContext {

    private static final ThreadLocal<UUID> TENANT_ID = new ThreadLocal<>();
    private static volatile boolean TENANT_ENABLED = false;

    private TenantContext() {
        // Utility class
    }

    public static void setTenantId(UUID tenantId) {
        TENANT_ID.set(tenantId);
    }

    public static UUID getTenantId() {
        UUID tenantId = TENANT_ID.get();
        if (tenantId != null) {
            return tenantId;
        }
        throw new IllegalStateException("Tenant context is not set for the current request");
    }

    public static boolean isTenantEnabled() {
        return TENANT_ENABLED;
    }

    public static void setTenantEnabled(boolean enabled) {
        TENANT_ENABLED = enabled;
    }

    public static UUID getTenantIdOrNull() {
        return TENANT_ID.get();
    }

    public static String getTenantIdAsString() {
        return getTenantId().toString();
    }

    public static boolean isSet() {
        return TENANT_ID.get() != null;
    }

    public static void clear() {
        TENANT_ID.remove();
    }
}

