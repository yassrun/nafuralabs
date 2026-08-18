package ma.nafura.platform.administration.iam.service;

import ma.nafura.platform.authorization.service.CustomRolePermissionProvider;
import ma.nafura.platform.administration.iam.repository.TenantCustomRolePermissionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Provides permissions for tenant custom roles (from tenant_custom_role_permission).
 */
@Service
public class CustomRolePermissionProviderImpl implements CustomRolePermissionProvider {

    private final TenantCustomRolePermissionRepository tenantCustomRolePermissionRepository;

    public CustomRolePermissionProviderImpl(TenantCustomRolePermissionRepository tenantCustomRolePermissionRepository) {
        this.tenantCustomRolePermissionRepository = tenantCustomRolePermissionRepository;
    }

    @Override
    public List<String> getPermissionsForTenantRole(UUID tenantId, String roleCode) {
        if (tenantId == null || roleCode == null || roleCode.isBlank()) {
            return List.of();
        }
        return tenantCustomRolePermissionRepository.findByTenantIdAndRoleCode(tenantId, roleCode.toUpperCase()).stream()
            .map(p -> p.getPermission())
            .collect(Collectors.toList());
    }
}

