package ma.nafura.platform.scope.security.config;

import ma.nafura.platform.framework.context.TenantContext;

/**
 * Initializes scoped context mode based on configuration.
 */
public class TenantContextInitializer {

    public TenantContextInitializer(TenantScopeProperties tenantScopeProperties) {
        String mode = tenantScopeProperties.getMode();
        boolean fixedScopeMode = "none".equalsIgnoreCase(mode) || "single".equalsIgnoreCase(mode);
        boolean enabled = tenantScopeProperties.isEnabled() || fixedScopeMode;
        TenantContext.setTenantEnabled(enabled);
    }
}


