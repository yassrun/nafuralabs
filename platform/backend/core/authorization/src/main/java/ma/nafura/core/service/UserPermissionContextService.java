package ma.nafura.platform.authorization.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Applies resolved role codes to request user context.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserPermissionContextService {

    private final PermissionService permissionService;
    private final Optional<CustomRolePermissionProvider> customRolePermissionProvider;

    /**
     * Resolve and apply primary role + permission set on the current request context.
     */
    public void applyRoleCodes(List<String> roleCodes, String principal, boolean allowBootstrapFallback) {
        List<String> normalized = normalize(roleCodes);
        if (normalized.isEmpty()) {
            applyEmptyRoleContext(principal, allowBootstrapFallback);
            return;
        }

        UserContext.setUserRole(normalized.get(0));
        Set<String> permissions = resolvePermissionsForRoles(normalized);
        if (permissions.isEmpty() && normalized.contains("OWNER")) {
            log.warn("OWNER role resolved to no permissions for {}; applying wildcard", principal);
            permissions = Set.of("*");
        } else if (permissions.isEmpty() && allowBootstrapFallback && permissionService.getAllRoleCodes().isEmpty()) {
            log.warn("No role-permission mappings found; enabling bootstrap wildcard permissions for {}", principal);
            if (UserContext.getUserRole() == null || UserContext.getUserRole().isBlank()) {
                UserContext.setUserRole("BOOTSTRAP_AUTHENTICATED");
            }
            permissions = Set.of("*");
        }
        UserContext.setPermissions(permissions);
    }

    private void applyEmptyRoleContext(String principal, boolean allowBootstrapFallback) {
        UserContext.setUserRole(null);
        if (allowBootstrapFallback && permissionService.getAllRoleCodes().isEmpty()) {
            log.warn("No role-permission mappings found; enabling bootstrap wildcard permissions for {}", principal);
            UserContext.setUserRole("BOOTSTRAP_AUTHENTICATED");
            UserContext.setPermissions(Set.of("*"));
            return;
        }
        UserContext.setPermissions(Set.of());
    }

    /**
     * Resolve permissions for roles: use custom role provider when tenant is set, else system only.
     */
    private Set<String> resolvePermissionsForRoles(List<String> normalizedRoleCodes) {
        if (customRolePermissionProvider.isPresent() && TenantContext.isSet()) {
            UUID tenantId = TenantContext.getTenantId();
            Set<String> merged = new HashSet<>();
            for (String roleCode : normalizedRoleCodes) {
                List<String> custom = customRolePermissionProvider.get().getPermissionsForTenantRole(tenantId, roleCode);
                if (!custom.isEmpty()) {
                    merged.addAll(custom);
                } else {
                    merged.addAll(permissionService.getPermissionsForRole(roleCode));
                }
            }
            return merged;
        }
        return new HashSet<>(permissionService.getPermissionsForRoles(normalizedRoleCodes));
    }

    private List<String> normalize(List<String> roleCodes) {
        if (roleCodes == null || roleCodes.isEmpty()) {
            return List.of();
        }
        return roleCodes.stream()
                .filter(role -> role != null && !role.isBlank())
                .map(role -> role.toUpperCase().trim())
                .distinct()
                .toList();
    }
}


