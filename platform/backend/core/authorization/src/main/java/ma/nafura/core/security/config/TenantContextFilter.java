package ma.nafura.platform.authorization.security.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import ma.nafura.platform.tenancy.domain.model.TenantMembership;
import ma.nafura.platform.tenancy.repository.TenantMembershipRepository;
import ma.nafura.platform.tenancy.repository.TenantRepository;
import ma.nafura.platform.authorization.repository.TenantUserRoleRepository;
import ma.nafura.platform.authorization.security.authorization.PublicEndpointRegistry;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.platform.authorization.security.jwt.JwtTokenExtractor;
import ma.nafura.platform.authorization.security.properties.SecurityProperties;
import ma.nafura.platform.authorization.service.UserPermissionContextService;
import org.springframework.core.annotation.Order;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Filter that sets the tenant context for each request.
 * 
 * <p>Extracts tenant ID from:
 * <ol>
 *   <li>X-Tenant-Id header (preferred)</li>
 *   <li>URL pattern /api/tenants/{tenantId}/... (fallback)</li>
 *   <li>Optional default tenant fallback (development only, explicitly enabled)</li>
 * </ol>
 * 
 * <p>Validates (configurable):
 * <ul>
 *   <li>Tenant exists</li>
 *   <li>User is member of tenant (unless SUPER_ADMIN)</li>
 * </ul>
 * 
 * @see SecurityProperties.TenantProperties for configuration options
 */
@Order(2) // Execute after UserContextFilter
public class TenantContextFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(TenantContextFilter.class);
    private static final String MEMBER_STATUS_ACTIVE = "ACTIVE";
    
    private final TenantRepository tenantRepository;
    private final TenantMembershipRepository tenantMembershipRepository;
    private final TenantUserRoleRepository tenantUserRoleRepository;
    private final PublicEndpointRegistry publicEndpointRegistry;
    private final JwtTokenExtractor jwtTokenExtractor;
    private final SecurityProperties securityProperties;
    private final UserPermissionContextService userPermissionContextService;

    public TenantContextFilter(
            TenantRepository tenantRepository,
            TenantMembershipRepository tenantMembershipRepository,
            TenantUserRoleRepository tenantUserRoleRepository,
            PublicEndpointRegistry publicEndpointRegistry,
            JwtTokenExtractor jwtTokenExtractor,
            SecurityProperties securityProperties,
            UserPermissionContextService userPermissionContextService) {
        this.tenantRepository = tenantRepository;
        this.tenantMembershipRepository = tenantMembershipRepository;
        this.tenantUserRoleRepository = tenantUserRoleRepository;
        this.publicEndpointRegistry = publicEndpointRegistry;
        this.jwtTokenExtractor = jwtTokenExtractor;
        this.securityProperties = securityProperties;
        this.userPermissionContextService = userPermissionContextService;
    }
    
    // Pattern to match /api/tenants/{tenantId}/...
    private static final Pattern TENANT_URL_PATTERN = Pattern.compile("/api/tenants/([0-9a-fA-F-]{36})");
    
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        
        String path = request.getRequestURI();
        
        // Skip tenant context for configured paths (no tenant required)
        if (shouldSkipTenantContext(request, path)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Self-service tenant creation (no tenant context yet)
        if ("POST".equalsIgnoreCase(request.getMethod()) && "/api/tenants".equals(path)) {
            filterChain.doFilter(request, response);
            return;
        }
        
        try {
            UUID tenantId = extractTenantId(request);

            if (tenantId == null) {
                log.warn("No tenant ID found in request: {}", path);
                response.sendError(HttpServletResponse.SC_BAD_REQUEST,
                        "Missing " + securityProperties.getTenant().getHeaderName() + " header or tenant ID in URL");
                return;
            }

            // Validate tenant exists (if enabled)
            if (securityProperties.getTenant().isValidateTenant() && !tenantRepository.existsById(tenantId)) {
                log.warn("Tenant not found: {}", tenantId);
                response.sendError(HttpServletResponse.SC_NOT_FOUND, "Tenant not found");
                return;
            }

            // Check if super admin (already resolved by UserContextFilter)
            boolean superAdmin = UserContext.isSuperAdmin();

            // Verify user is member of tenant (if enabled and not SUPER_ADMIN)
            if (securityProperties.getTenant().isValidateMembership() &&
                    !superAdmin && !verifyUserMembership(tenantId)) {
                log.warn("User is not a member of tenant: {}", tenantId);
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Access denied: not a member of this tenant");
                return;
            }

            // Set tenant context
            TenantContext.setTenantId(tenantId);

            // Load tenant-specific user role and permissions
            loadUserContext(tenantId, superAdmin);

            log.debug("Tenant context set: tenantId={}, superAdmin={}, permissions={}",
                    tenantId, superAdmin, UserContext.getPermissions().size());

            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
    
    /**
     * Check if tenant context should be skipped for this path.
     */
    private boolean shouldSkipTenantContext(HttpServletRequest request, String path) {
        if (publicEndpointRegistry.isPublic(request)) {
            return true;
        }

        return securityProperties.getTenant().getSkipPaths().stream()
                .anyMatch(skipPath -> {
                    if (skipPath.endsWith("/")) {
                        return path.startsWith(skipPath);
                    }
                    return path.equals(skipPath) || path.startsWith(skipPath + "/");
                });
    }
    
    /**
     * Extract tenant ID from request.
     * Priority: Header > URL pattern > optional default fallback (dev only)
     */
    private UUID extractTenantId(HttpServletRequest request) {
        SecurityProperties.TenantProperties tenantProps = securityProperties.getTenant();
        
        // 1. Try header (preferred)
        String tenantIdHeader = request.getHeader(tenantProps.getHeaderName());
        if (StringUtils.hasText(tenantIdHeader)) {
            try {
                return UUID.fromString(tenantIdHeader.trim());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid tenant ID in {} header: {}", tenantProps.getHeaderName(), tenantIdHeader);
            }
        }
        
        // 2. Try URL pattern /api/tenants/{tenantId}/...
        String path = request.getRequestURI();
        Matcher matcher = TENANT_URL_PATTERN.matcher(path);
        if (matcher.find()) {
            try {
                return UUID.fromString(matcher.group(1));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid tenant ID in URL: {}", matcher.group(1));
            }
        }
        
        // 3. Optional fallback to default tenant (development only, explicitly enabled)
        if (tenantProps.isAllowDefaultTenantFallback()) {
            String defaultTenantId = tenantProps.getDefaultTenantId();
            if (StringUtils.hasText(defaultTenantId)) {
                log.warn("No tenant ID found, using configured default tenant fallback");
                try {
                    return UUID.fromString(defaultTenantId);
                } catch (IllegalArgumentException e) {
                    log.error("Invalid default tenant ID configured: {}", defaultTenantId);
                }
            }
        }
        
        return null;
    }

    /**
     * Verify user is a member of the specified tenant.
     */
    private boolean verifyUserMembership(UUID tenantId) {
        try {
            return resolveCurrentUserEmail()
                    .map(email -> tenantMembershipRepository.existsByTenantIdAndEmailAndStatus(
                            tenantId,
                            email,
                            MEMBER_STATUS_ACTIVE))
                    .orElse(false);
        } catch (Exception e) {
            log.warn("Error verifying user membership: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Load tenant-scoped user role and permissions.
     */
    private void loadUserContext(UUID tenantId, boolean superAdmin) {
        try {
            Optional<String> emailOpt = resolveCurrentUserEmail();

            if (emailOpt.isEmpty()) {
                log.debug("No email in JWT, skipping user context loading");
                return;
            }

            String email = emailOpt.get();
            UserContext.setUserEmail(email);
            
            if (superAdmin) {
                // Super admin has all permissions
                jwtTokenExtractor.getSubject().ifPresent(this::setUserIdIfUuid);
                UserContext.setPermissions(Set.of("*"));
                UserContext.setUserRole("SUPER_ADMIN");
                return;
            }

            // Load membership first (tenant-scoped role source)
            Optional<TenantMembership> membershipOpt =
                tenantMembershipRepository.findByTenantIdAndEmailAndStatus(
                        tenantId,
                        email,
                        MEMBER_STATUS_ACTIVE);

            if (membershipOpt.isEmpty()) {
                log.warn("Active membership not found for user {} in tenant {}", email, tenantId);
                UserContext.setUserRole(null);
                UserContext.setPermissions(Set.of());
                return;
            }

            TenantMembership membership = membershipOpt.get();
            UserContext.setUserId(membership.getUserId());
            List<String> roleCodes = tenantUserRoleRepository.findRoleCodesByTenantIdAndUserId(
                    tenantId,
                    membership.getUserId());

            userPermissionContextService.applyRoleCodes(roleCodes, email, true);
             
        } catch (Exception e) {
            log.error("Error loading user context: {}", e.getMessage(), e);
            UserContext.setUserRole(null);
            UserContext.setPermissions(Set.of());
        }
    }

    private Optional<String> resolveCurrentUserEmail() {
        String emailFromContext = UserContext.getUserEmail();
        if (emailFromContext != null && !emailFromContext.isBlank()) {
            return Optional.of(emailFromContext);
        }
        return jwtTokenExtractor.getEmail();
    }

    private void setUserIdIfUuid(String subject) {
        if (!StringUtils.hasText(subject)) {
            return;
        }
        try {
            UserContext.setUserId(UUID.fromString(subject.trim()));
        } catch (IllegalArgumentException ex) {
            log.debug("JWT subject is not a UUID, userId context not set: {}", subject);
        }
    }
}



