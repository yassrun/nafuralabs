package ma.nafura.platform.authorization.security.properties;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Configuration properties for the shared security module.
 * 
 * <p>Configure in application.yml:
 * <pre>
 * nafura:
 *   security:
 *     public-endpoints:
 *       - /actuator/**
 *       - /api/sync/**
 *     cors:
 *       allowed-origin-patterns:
 *         - http://localhost:*
 *         - https://*.nafura.com
 *       allowed-methods:
 *         - GET
 *         - POST
 *         - PUT
 *         - DELETE
 *       allow-credentials: true
 *     tenant:
 *       skip-paths:
 *         - /api/auth/
 *         - /actuator/
 *       validate-membership: true
 *       allow-default-tenant-fallback: false
 *     user-context:
 *       enabled: true
 * </pre>
 */
@Data
@ConfigurationProperties(prefix = "nafura.security")
public class SecurityProperties {
    
    /**
     * Additional public endpoint path patterns that don't require authentication.
     * Use this mainly for non-controller routes (e.g., actuator, webhooks).
     *
     * Controller routes should prefer {@link ma.nafura.platform.authorization.security.authorization.PublicEndpoint}
     * as the source of truth.
     */
    private List<String> publicEndpoints = new ArrayList<>(Arrays.asList(
            "/actuator/**",
            "/actuator/health/**",
            "/api/sync/**",
            "/api/sync/health"
    ));
    
    /**
     * CORS configuration.
     */
    private CorsProperties cors = new CorsProperties();
    
    /**
     * Tenant context configuration.
     */
    private TenantProperties tenant = new TenantProperties();

    /**
     * User context configuration.
     */
    private UserContextProperties userContext = new UserContextProperties();
    
    @Data
    public static class CorsProperties {
        /**
         * Allowed origin patterns for CORS.
         */
        private List<String> allowedOriginPatterns = new ArrayList<>(Arrays.asList(
                "http://localhost:*",
                "http://*.nafura.local",
                "https://*.nafura.com",
                "http://*.nafuralabs.com",
                "https://*.nafuralabs.com"
        ));
        
        /**
         * Allowed HTTP methods.
         */
        private List<String> allowedMethods = new ArrayList<>(Arrays.asList(
                "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
        ));
        
        /**
         * Allowed headers.
         */
        private List<String> allowedHeaders = new ArrayList<>(List.of("*"));
        
        /**
         * Exposed headers.
         */
        private List<String> exposedHeaders = new ArrayList<>(Arrays.asList(
                "Content-Disposition", "Content-Type", "Authorization"
        ));
        
        /**
         * Whether to allow credentials.
         */
        private boolean allowCredentials = true;
    }
    
    @Data
    public static class TenantProperties {
        /**
         * Tenancy mode for the application.
         * Supported values: none, single, multi.
         */
        private String mode = "multi";

        /**
         * Whether tenant context is enabled.
         * Keep enabled when business data is tenant-scoped, even for mode=none.
         */
        private boolean enabled = true;

        /**
         * Paths to skip tenant context processing.
         * Requests to these paths won't require a tenant ID.
         */
        private List<String> skipPaths = new ArrayList<>(Arrays.asList(
                "/api/auth/",
                "/actuator/",
                "/api/sync/health"
        ));
        
        /**
         * Whether to validate that the tenant exists in the database.
         */
        private boolean validateTenant = true;
        
        /**
         * Whether to validate that the user is a member of the tenant.
         * If false, only authentication is required, not membership.
         */
        private boolean validateMembership = true;
        
        /**
         * Allows using defaultTenantId when no tenant is provided in request.
         * Keep disabled in production.
         */
        private boolean allowDefaultTenantFallback = false;

        /**
         * Optional default tenant ID for local development fallback.
         * Only used when allowDefaultTenantFallback = true.
         */
        private String defaultTenantId;
        
        /**
         * Header name for tenant ID.
         */
        private String headerName = "X-Tenant-Id";
    }

    @Data
    public static class UserContextProperties {
        /**
         * Whether user context filter is enabled.
         * Should remain enabled in normal operation.
         */
        private boolean enabled = true;
    }
}

