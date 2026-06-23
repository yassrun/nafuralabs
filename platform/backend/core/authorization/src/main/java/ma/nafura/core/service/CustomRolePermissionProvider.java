package ma.nafura.platform.authorization.service;

import java.util.List;
import java.util.UUID;

/**
 * Optional provider for tenant-scoped (custom) role permissions.
 * When present, permission resolution uses this for custom roles before falling back to system role_permission.
 */
public interface CustomRolePermissionProvider {

    /**
     * Get permissions for a role in the given tenant (e.g. from tenant_custom_role_permission).
     * Return empty list if the role is not a custom role or has no permissions.
     */
    List<String> getPermissionsForTenantRole(UUID tenantId, String roleCode);
}

