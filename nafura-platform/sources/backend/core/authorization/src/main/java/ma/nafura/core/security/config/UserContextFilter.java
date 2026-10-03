package ma.nafura.platform.authorization.security.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.authorization.repository.TenantUserRoleRepository;
import ma.nafura.platform.authorization.repository.UserRoleRepository;
import ma.nafura.platform.authorization.security.jwt.JwtTokenExtractor;
import ma.nafura.platform.authorization.security.properties.SecurityProperties;
import ma.nafura.platform.authorization.service.UserPermissionContextService;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.platform.identity.service.AppUserProvisioningService;
import ma.nafura.platform.tenancy.repository.TenantMembershipRepository;
import org.springframework.core.annotation.Order;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Order 1 — identity only (before tenant RBAC).
 *
 * <p>Owns:
 * <ul>
 *   <li>email / userId from JWT</li>
 *   <li>AppUser provisioning</li>
 *   <li>super-admin flag</li>
 *   <li>global platform roles ({@code user_role}) and their permissions</li>
 * </ul>
 *
 * <p>Does <strong>not</strong> own tenant-scoped RBAC when
 * {@code nafura.security.tenant.mode=multi} — that is {@link TenantContextFilter}.
 *
 * <p>When mode is {@code single}/{@code none} (no {@link TenantContextFilter}),
 * falls back to the unique active membership's roles.
 */
@Slf4j
@Order(1)
@RequiredArgsConstructor
public class UserContextFilter extends OncePerRequestFilter {

    private static final String MEMBER_STATUS_ACTIVE = "ACTIVE";

    private final UserRoleRepository userRoleRepository;
    private final TenantMembershipRepository tenantMembershipRepository;
    private final TenantUserRoleRepository tenantUserRoleRepository;
    private final JwtTokenExtractor jwtTokenExtractor;
    private final AppUserProvisioningService appUserProvisioningService;
    private final UserPermissionContextService userPermissionContextService;
    private final SecurityProperties securityProperties;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        try {
            Optional<String> emailOpt = jwtTokenExtractor.getEmail();
            Optional<String> subjectOpt = jwtTokenExtractor.getSubject();
            Optional<String> principalOpt = emailOpt.isPresent() ? emailOpt : subjectOpt;
            if (principalOpt.isPresent()) {
                String principal = principalOpt.get();
                String email = emailOpt.orElse(principal);
                UserContext.setUserEmail(email);
                if (emailOpt.isPresent()) {
                    appUserProvisioningService.provisionAuthenticatedUser(
                        email,
                        jwtTokenExtractor.getClaim("given_name").orElse(null),
                        jwtTokenExtractor.getClaim("family_name").orElse(null)
                    );
                }
                jwtTokenExtractor.getSubject().ifPresent(this::setUserIdIfUuid);

                // Roles are the product's (user_role, tenant_user_role), never the shared realm's: a realm role
                // would grant the same code in every product of the realm.
                boolean superAdmin = emailOpt.isPresent()
                    && userRoleRepository.existsByEmailIgnoreCaseAndRoleCode(email, "SUPER_ADMIN");
                UserContext.setSuperAdmin(superAdmin);

                if (superAdmin) {
                    UserContext.setUserRole("SUPER_ADMIN");
                    UserContext.setPermissions(Set.of("*"));
                } else {
                    applyNonSuperAdminRoles(emailOpt, email);
                }
            }

            filterChain.doFilter(request, response);
        } catch (Exception e) {
            log.warn("Error loading user context: {}", e.getMessage());
            filterChain.doFilter(request, response);
        } finally {
            UserContext.clear();
            TenantContext.clear();
        }
    }

    private void applyNonSuperAdminRoles(Optional<String> emailOpt, String email) {
        List<String> roleCodes = emailOpt.isPresent()
            ? userRoleRepository.findRoleCodesByEmailIgnoreCase(email)
            : List.of();

        // Tenant-scoped roles belong to TenantContextFilter in multi mode.
        if (!isMultiTenantMode() && roleCodes.isEmpty() && emailOpt.isPresent()) {
            List<UUID> activeTenantIds = tenantMembershipRepository.findDistinctTenantIdsByEmailAndStatus(
                    email,
                    MEMBER_STATUS_ACTIVE);
            if (activeTenantIds.size() == 1) {
                roleCodes = tenantUserRoleRepository.findRoleCodesByTenantIdAndEmailIgnoreCase(
                        activeTenantIds.get(0),
                        email);
            }
        }

        userPermissionContextService.applyRoleCodes(roleCodes, email);
    }

    private boolean isMultiTenantMode() {
        String mode = securityProperties.getTenant().getMode();
        return mode != null && mode.equalsIgnoreCase("multi");
    }

    private void setUserIdIfUuid(String subject) {
        if (subject == null || subject.isBlank()) {
            return;
        }
        try {
            UserContext.setUserId(UUID.fromString(subject.trim()));
        } catch (IllegalArgumentException ex) {
            log.debug("JWT subject is not a UUID, userId context not set: {}", subject);
        }
    }
}
