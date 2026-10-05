package ma.nafura.platform.administration.access.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.administration.access.api.CreateRoleRequest;
import ma.nafura.platform.administration.access.api.DomainToggleResponse;
import ma.nafura.platform.administration.access.api.RoleResponse;
import ma.nafura.platform.administration.access.api.UpdateRoleRequest;
import ma.nafura.platform.administration.access.domain.TenantCustomRole;
import ma.nafura.platform.administration.access.domain.TenantCustomRolePermission;
import ma.nafura.platform.administration.access.domain.TenantCustomRolePermissionRepository;
import ma.nafura.platform.administration.access.domain.TenantCustomRoleRepository;
import ma.nafura.platform.administration.access.roles.DeclaredRoles;
import ma.nafura.platform.administration.access.roles.DeclaredRolesSeeder;
import ma.nafura.platform.authorization.domain.model.TenantUserRole;
import ma.nafura.platform.authorization.repository.TenantUserRoleRepository;
import ma.nafura.platform.authorization.service.PermissionMetadataService;
import ma.nafura.platform.authorization.service.PermissionService;
import ma.nafura.platform.authorization.security.authorization.OperatorPermissions;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.platform.tenancy.domain.model.TenantDomain;
import ma.nafura.platform.tenancy.repository.TenantDomainRepository;
import ma.nafura.platform.tenancy.repository.TenantRepository;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Who may do what in an organization: the declared roles (platform, business contexts, application),
 * the organization's own roles, and which business contexts the organization has switched on.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AccessService {

    private static final String DOMAIN_STATUS_ACTIVE = "ACTIVE";
    private static final String DOMAIN_STATUS_INACTIVE = "INACTIVE";

    private final TenantRepository tenantRepository;
    private final TenantDomainRepository tenantDomainRepository;
    private final TenantUserRoleRepository tenantUserRoleRepository;
    private final TenantCustomRoleRepository tenantCustomRoleRepository;
    private final TenantCustomRolePermissionRepository tenantCustomRolePermissionRepository;
    private final PermissionService permissionService;
    private final PermissionMetadataService permissionMetadataService;
    private final ObjectProvider<DeclaredRolesSeeder> declaredRoles;

    /** app.nafura.json spec.customRoles: false keeps organizations to the declared roles. */
    @Value("${nafura.roles.custom-enabled:true}")
    private boolean customRolesEnabled;

    // ─────────────────────────────────────────────────────────────────────────────
    // Roles
    // ─────────────────────────────────────────────────────────────────────────────

    /** Declared roles (read-only), then the organization's own roles, with their member counts. */
    public List<RoleResponse> getRoles(UUID tenantId) {
        requireTenant(tenantId);
        Map<String, Long> memberCounts = getRoleMemberCounts(tenantId);
        List<RoleResponse> result = new ArrayList<>(permissionService.getAllRoleCodes().stream()
            .map(role -> systemRole(role, permissionService.getPermissionsForRole(role),
                memberCounts.getOrDefault(role.toUpperCase(Locale.ROOT), 0L)))
            .toList());
        tenantCustomRoleRepository.findByTenantIdOrderByRoleCode(tenantId).forEach(custom -> result.add(customRole(
            custom, permissionsOf(tenantId, custom.getRoleCode()),
            memberCounts.getOrDefault(custom.getRoleCode().toUpperCase(Locale.ROOT), 0L))));
        return result;
    }

    public RoleResponse getRole(UUID tenantId, String roleCode) {
        requireTenant(tenantId);
        String code = normalize(roleCode);
        if (!roleExists(tenantId, code)) {
            throw new IllegalArgumentException("Role not found: " + roleCode);
        }
        List<String> permissions = permissionsOf(tenantId, code);
        long memberCount = tenantUserRoleRepository.countByTenantIdAndRoleCode(tenantId, code);
        return tenantCustomRoleRepository.findByTenantIdAndRoleCode(tenantId, code)
            .map(custom -> customRole(custom, permissions, memberCount))
            .orElseGet(() -> systemRole(code, permissions, memberCount));
    }

    /** Whether the role exists for this organization (declared or its own). */
    public boolean roleExists(UUID tenantId, String roleCode) {
        if (roleCode == null || roleCode.isBlank()) return false;
        String code = normalize(roleCode);
        return permissionService.roleExists(code) || tenantCustomRoleRepository.existsByTenantIdAndRoleCode(tenantId, code);
    }

    public Map<String, Long> getRoleMemberCounts(UUID tenantId) {
        requireTenant(tenantId);
        Map<String, Long> result = new HashMap<>();
        for (Object[] row : tenantUserRoleRepository.countMembersByRoleCode(tenantId)) {
            if (row.length >= 2 && row[0] != null && row[1] != null) {
                result.put(String.valueOf(row[0]).toUpperCase(Locale.ROOT), ((Number) row[1]).longValue());
            }
        }
        return result;
    }

    @Transactional
    public RoleResponse createRole(UUID tenantId, CreateRoleRequest request) {
        requireTenant(tenantId);
        requireCustomRoles();
        String code = normalize(request.roleCode());
        // A declared code would let the organization rewrite a role the product relies on.
        if (permissionService.roleExists(code) || declaredRole(code).isPresent()) {
            throw new IllegalArgumentException("Role code " + code + " is declared by the platform or the application");
        }
        if (tenantCustomRoleRepository.existsByTenantIdAndRoleCode(tenantId, code)) {
            throw new IllegalArgumentException("Role already exists: " + code);
        }
        List<String> permissions = grantable(request.permissions());
        TenantCustomRole role = tenantCustomRoleRepository.save(TenantCustomRole.builder()
            .tenantId(tenantId)
            .roleCode(code)
            .name(request.name() != null ? request.name().trim() : code)
            .description(request.description() != null ? request.description().trim() : null)
            .build());
        savePermissions(tenantId, code, permissions);
        permissionService.invalidateRoleCache(code);
        return customRole(role, permissionsOf(tenantId, code), 0L);
    }

    /** Only the organization's own roles change; declared roles change with the product. */
    @Transactional
    public RoleResponse updateRole(UUID tenantId, String roleCode, UpdateRoleRequest request) {
        requireTenant(tenantId);
        requireCustomRoles();
        String code = normalize(roleCode);
        TenantCustomRole role = tenantCustomRoleRepository.findByTenantIdAndRoleCode(tenantId, code)
            .orElseThrow(() -> new IllegalArgumentException("Custom role not found: " + roleCode));
        if (request.name() != null && !request.name().isBlank()) {
            role.setName(request.name().trim());
        }
        if (request.description() != null) {
            role.setDescription(request.description().isBlank() ? null : request.description().trim());
        }
        if (request.permissions() != null) {
            List<String> permissions = grantable(request.permissions());
            tenantCustomRolePermissionRepository.deleteByTenantIdAndRoleCode(tenantId, code);
            savePermissions(tenantId, code, permissions);
        }
        tenantCustomRoleRepository.save(role);
        permissionService.invalidateRoleCache(code);
        return customRole(role, permissionsOf(tenantId, code), tenantUserRoleRepository.countByTenantIdAndRoleCode(tenantId, code));
    }

    /** Deletes one of the organization's own roles, removing it from its members first. */
    @Transactional
    public void deleteRole(UUID tenantId, String roleCode) {
        requireTenant(tenantId);
        String code = normalize(roleCode);
        if (permissionService.roleExists(code)) {
            throw new IllegalArgumentException("Cannot delete declared role: " + roleCode);
        }
        if (!tenantCustomRoleRepository.existsByTenantIdAndRoleCode(tenantId, code)) {
            throw new IllegalArgumentException("Custom role not found: " + roleCode);
        }
        List<UUID> userIds = tenantUserRoleRepository.findByTenantIdAndRoleCode(tenantId, code).stream()
            .map(TenantUserRole::getUserId)
            .toList();
        if (!userIds.isEmpty()) {
            tenantUserRoleRepository.deleteByTenantIdAndRoleCodeAndUserIdIn(tenantId, code, userIds);
        }
        tenantCustomRolePermissionRepository.deleteByTenantIdAndRoleCode(tenantId, code);
        tenantCustomRoleRepository.deleteByTenantIdAndRoleCode(tenantId, code);
        permissionService.invalidateRoleCache(code);
        log.info("Deleted custom role {} in tenant {}", code, tenantId);
    }

    private void requireCustomRoles() {
        if (!customRolesEnabled) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This application only uses its declared roles");
        }
    }

    /** Known permissions the current user holds: an administrator cannot grant more than they have. */
    private List<String> grantable(List<String> requested) {
        List<String> permissions = requested == null ? List.of() : requested.stream()
            .filter(p -> p != null && !p.isBlank())
            .map(String::trim)
            .distinct()
            .toList();
        List<String> operator = permissions.stream().filter(OperatorPermissions::isOperatorPermission).toList();
        if (!operator.isEmpty()) {
            throw new IllegalArgumentException("Operator permissions are granted only by the deployment, not by a role: " + String.join(", ", operator));
        }
        Set<String> known = Set.copyOf(permissionMetadataService.getAllPermissionCodes());
        List<String> unknown = permissions.stream().filter(p -> !known.contains(p)).toList();
        if (!unknown.isEmpty()) {
            throw new IllegalArgumentException("Unknown permission(s): " + String.join(", ", unknown));
        }
        List<String> notHeld = permissions.stream().filter(p -> !UserContext.hasPermission(p)).toList();
        if (!notHeld.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot grant permissions you do not have: " + String.join(", ", notHeld));
        }
        return permissions;
    }

    private void savePermissions(UUID tenantId, String code, List<String> permissions) {
        permissions.forEach(permission -> tenantCustomRolePermissionRepository.save(TenantCustomRolePermission.builder()
            .tenantId(tenantId)
            .roleCode(code)
            .permission(permission)
            .build()));
    }

    private List<String> permissionsOf(UUID tenantId, String roleCode) {
        if (roleCode == null || roleCode.isBlank()) return List.of();
        List<TenantCustomRolePermission> custom = tenantCustomRolePermissionRepository.findByTenantIdAndRoleCode(tenantId, roleCode);
        if (!custom.isEmpty()) {
            return custom.stream().map(TenantCustomRolePermission::getPermission).toList();
        }
        return permissionService.getPermissionsForRole(roleCode);
    }

    private Optional<DeclaredRoles.Role> declaredRole(String code) {
        return Optional.ofNullable(declaredRoles.getIfAvailable()).flatMap(seeder -> seeder.declaredRole(code));
    }

    /** Declared roles are configuration: read-only, labelled by their manifest. */
    private RoleResponse systemRole(String code, List<String> permissions, long memberCount) {
        return declaredRole(code)
            .map(role -> new RoleResponse(
                role.code(),
                role.label(),
                description(role.owner()),
                permissions,
                true,
                30,
                memberCount,
                RoleResponse.resolveScopeType(role.code())))
            .orElseGet(() -> RoleResponse.fromRole(code, permissions, memberCount));
    }

    private static String description(String owner) {
        if (DeclaredRoles.PLATFORM.equals(owner)) return "Rôle de la plateforme";
        return owner.startsWith("bc.") ? "Rôle du module " + owner : "Rôle de l’application";
    }

    private static RoleResponse customRole(TenantCustomRole role, List<String> permissions, long memberCount) {
        return new RoleResponse(role.getRoleCode(), role.getName(),
            role.getDescription() != null ? role.getDescription() : "Rôle de l’organisation",
            permissions, false, 10, memberCount, RoleResponse.resolveScopeType(role.getRoleCode()));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Business contexts switched on per organization (D-10)
    // ─────────────────────────────────────────────────────────────────────────────

    /**
     * Domains of the tenant: the business contexts the application declares (active unless the tenant
     * disabled them) plus any other tenant_domain row (products seeding their own domains).
     */
    public List<DomainToggleResponse> getDomains(UUID tenantId) {
        requireTenant(tenantId);
        Map<String, TenantDomain> rows = tenantDomainRepository.findByTenantId(tenantId).stream()
            .collect(Collectors.toMap(TenantDomain::getDomainCode, row -> row, (a, b) -> a, LinkedHashMap::new));
        List<DomainToggleResponse> result = new ArrayList<>();
        for (DeclaredRolesSeeder.BusinessContext context : declaredBusinessContexts()) {
            TenantDomain row = rows.remove(context.domainCode());
            boolean enabled = row == null || DOMAIN_STATUS_ACTIVE.equalsIgnoreCase(row.getStatus());
            result.add(new DomainToggleResponse(context.domainCode(), context.label(), "", enabled, false, context.icon(), List.of()));
        }
        rows.values().forEach(row -> result.add(toDomainResponse(row)));
        return result;
    }

    public List<String> getEnabledDomainIds(UUID tenantId) {
        return getDomains(tenantId).stream()
            .filter(DomainToggleResponse::enabled)
            .map(DomainToggleResponse::code)
            .toList();
    }

    @Transactional
    public DomainToggleResponse updateDomain(UUID tenantId, String domainCode, boolean enabled) {
        requireTenant(tenantId);
        boolean declared = declaredBusinessContexts().stream().anyMatch(c -> c.domainCode().equals(domainCode));
        if (!declared && tenantDomainRepository.findByTenantIdAndDomainCode(tenantId, domainCode).isEmpty()) {
            throw new IllegalArgumentException("Unknown domain: " + domainCode);
        }
        TenantDomain tenantDomain = tenantDomainRepository.findByTenantIdAndDomainCode(tenantId, domainCode)
            .orElseGet(() -> {
                TenantDomain row = new TenantDomain();
                row.setTenantId(tenantId);
                row.setDomainCode(domainCode);
                return row;
            });
        tenantDomain.setStatus(enabled ? DOMAIN_STATUS_ACTIVE : DOMAIN_STATUS_INACTIVE);
        TenantDomain saved = tenantDomainRepository.save(tenantDomain);
        log.info("Domain '{}' {} for tenant {}", domainCode, enabled ? "enabled" : "disabled", tenantId);
        return getDomains(tenantId).stream().filter(d -> d.code().equals(domainCode)).findFirst()
            .orElseGet(() -> toDomainResponse(saved));
    }

    private List<DeclaredRolesSeeder.BusinessContext> declaredBusinessContexts() {
        DeclaredRolesSeeder seeder = declaredRoles.getIfAvailable();
        return seeder == null ? List.of() : seeder.businessContexts();
    }

    private static DomainToggleResponse toDomainResponse(TenantDomain row) {
        boolean enabled = DOMAIN_STATUS_ACTIVE.equalsIgnoreCase(row.getStatus());
        return new DomainToggleResponse(row.getDomainCode(), row.getDomainCode(), "", enabled, false, "folder", List.of());
    }

    private static String normalize(String roleCode) {
        return roleCode == null ? null : roleCode.trim().toUpperCase(Locale.ROOT);
    }

    private void requireTenant(UUID tenantId) {
        if (!tenantRepository.existsById(tenantId)) {
            throw new IllegalArgumentException("Tenant not found: " + tenantId);
        }
    }
}
