package ma.nafura.platform.authorization.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.authorization.domain.model.RolePermission;
import ma.nafura.platform.authorization.repository.RolePermissionRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing role permissions with caching.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PermissionService {
    
    private final RolePermissionRepository rolePermissionRepository;
    
    /**
     * Get all permissions for a role.
     * Results are cached for performance.
     */
    @Cacheable(value = "rolePermissions", key = "#roleCode", unless = "#result.isEmpty()")
    public List<String> getPermissionsForRole(String roleCode) {
        if (roleCode == null || roleCode.isBlank()) {
            log.warn("Role code is null or blank, returning empty permissions");
            return List.of();
        }
        
        log.debug("Fetching permissions for role: {}", roleCode);
        List<String> permissions = rolePermissionRepository.findByRoleCode(roleCode.toUpperCase())
            .stream()
            .map(RolePermission::getPermission)
            .collect(Collectors.toList());

        // System OWNER is full-access by contract; tolerate missing IAM bootstrap seed.
        if (permissions.isEmpty() && "OWNER".equals(roleCode.toUpperCase())) {
            return List.of("*");
        }

        return permissions;
    }
    
    /**
     * Get all permissions for multiple roles (union of all permissions).
     */
    @Cacheable(value = "rolePermissions", key = "#roleCodes.toString()", unless = "#result.isEmpty()")
    public List<String> getPermissionsForRoles(List<String> roleCodes) {
        if (roleCodes == null || roleCodes.isEmpty()) {
            return List.of();
        }

        return roleCodes.stream()
            .map(String::toUpperCase)
            .distinct()
            .flatMap(roleCode -> getPermissionsForRole(roleCode).stream())
            .distinct()
            .collect(Collectors.toList());
    }
    
    /**
     * Check if a role has a specific permission.
     */
    public boolean hasPermission(String roleCode, String permission) {
        if (roleCode == null || permission == null) {
            return false;
        }
        
        List<String> permissions = getPermissionsForRole(roleCode);
        
        if (permissions.contains(permission)) {
            return true;
        }
        
        return permissions.stream()
            .anyMatch(perm -> {
                if (perm.equals("*")) {
                    return true;
                }
                if (perm.endsWith(".*")) {
                    String prefix = perm.substring(0, perm.length() - 2);
                    return permission.startsWith(prefix + ".");
                }
                return false;
            });
    }

    /**
     * Get all role codes with permission definitions.
     */
    public List<String> getAllRoleCodes() {
        return rolePermissionRepository.findDistinctRoleCodes();
    }

    /**
     * Check if a role code exists in permission definitions.
     */
    public boolean roleExists(String roleCode) {
        if (roleCode == null || roleCode.isBlank()) {
            return false;
        }
        return rolePermissionRepository.existsByRoleCode(roleCode.toUpperCase());
    }

    @CacheEvict(value = "rolePermissions", key = "#roleCode")
    public void invalidateRoleCache(String roleCode) {
        log.debug("Invalidating cache for role: {}", roleCode);
    }

    @CacheEvict(value = "rolePermissions", allEntries = true)
    public void invalidateAllRoleCaches() {
        log.info("Invalidating all role permission caches");
    }
}

