package ma.nafura.platform.authorization.security.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.tenancy.repository.TenantMembershipRepository;
import ma.nafura.platform.authorization.repository.TenantUserRoleRepository;
import ma.nafura.platform.authorization.repository.UserRoleRepository;
import ma.nafura.platform.authorization.security.jwt.JwtTokenExtractor;
import ma.nafura.platform.identity.service.AppUserProvisioningService;
import ma.nafura.platform.authorization.service.UserPermissionContextService;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.springframework.core.annotation.Order;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Filter that loads user identity context (independent of tenancy).
 *
 * <p>This filter is always applicable for authenticated requests and sets:
 * <ul>
 *   <li>user email</li>
 *   <li>global role (if any)</li>
 *   <li>super-admin flag</li>
 *   <li>global wildcard permission for super-admin</li>
 * </ul>
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
                List<String> jwtRoles = jwtTokenExtractor.getRealmRoles().stream()
                    .filter(role -> role != null && !role.isBlank())
                    .map(role -> role.toUpperCase().trim())
                    .collect(Collectors.toList());

                boolean superAdmin = emailOpt.isPresent()
                    && userRoleRepository.existsByEmailIgnoreCaseAndRoleCode(email, "SUPER_ADMIN")
                    || jwtRoles.contains("SUPER_ADMIN");
                UserContext.setSuperAdmin(superAdmin);
                if (superAdmin) {
                    UserContext.setUserRole("SUPER_ADMIN");
                    UserContext.setPermissions(Set.of("*"));
                } else {
                    List<String> roleCodes = emailOpt.isPresent()
                        ? userRoleRepository.findRoleCodesByEmailIgnoreCase(email)
                        : List.of();

                    // Safe fallback for single-scope setups:
                    // use tenant-scoped roles only if exactly one active tenant exists for the user.
                    if (roleCodes.isEmpty() && emailOpt.isPresent()) {
                        List<UUID> activeTenantIds = tenantMembershipRepository.findDistinctTenantIdsByEmailAndStatus(
                                email,
                                MEMBER_STATUS_ACTIVE);
                        if (activeTenantIds.size() == 1) {
                            roleCodes = tenantUserRoleRepository.findRoleCodesByTenantIdAndEmailIgnoreCase(
                                    activeTenantIds.get(0),
                                    email);
                        }
                    }

                    if (roleCodes.isEmpty() && !jwtRoles.isEmpty()) {
                        roleCodes = jwtRoles.stream()
                            .filter(role -> !isTechnicalRealmRole(role))
                            .collect(Collectors.toList());
                    }
                    userPermissionContextService.applyRoleCodes(roleCodes, email, true);
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

    private boolean isTechnicalRealmRole(String role) {
        if (role == null) {
            return true;
        }
        String normalized = role.trim().toLowerCase();
        return normalized.isBlank()
                || normalized.equals("offline_access")
                || normalized.equals("uma_authorization")
                || normalized.startsWith("default-roles-");
    }
}



