package ma.nafura.platform.authorization.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.springframework.stereotype.Service;

import ma.nafura.platform.authorization.security.authorization.OperatorPermissions;
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
     * Permissions come only from role definitions: no role, or a role without permissions, grants nothing.
     */
    public void applyRoleCodes(List<String> roleCodes, String principal) {
        List<String> normalized = normalize(roleCodes);
        if (normalized.isEmpty()) {
            UserContext.setUserRole(null);
            UserContext.setPermissions(Set.of());
            return;
        }
        UserContext.setUserRoles(normalized);
        Set<String> permissions = resolvePermissionsForRoles(normalized);
        // A role never grants an operator permission: only the deployment's operators list does (OperatorDirectory).
        permissions.removeIf(OperatorPermissions::isOperatorPermission);
        if (permissions.isEmpty()) {
            log.debug("Roles {} of {} grant no permission", normalized, principal);
        }
        UserContext.setPermissions(permissions);
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


