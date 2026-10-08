package ma.nafura.platform.administration.access.api;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.administration.access.service.AccessService;
import ma.nafura.platform.authorization.api.response.tenant.PermissionGroupResponse;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.authorization.service.PermissionMetadataService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Roles of an organization, the permission catalog, and the business contexts it has switched on. */
@RestController
@RequestMapping("/api/tenants")
@SecuredResource(module = "tenant", resource = "admin")
@RequiredArgsConstructor
public class AccessController {

    private final AccessService access;
    private final PermissionMetadataService permissionMetadata;

    @GetMapping("/{tenantId}/roles")
    @RequirePermission(value = "tenant.roles.read", fullPermission = true)
    public List<RoleResponse> getRoles(@PathVariable UUID tenantId) {
        return access.getRoles(tenantId);
    }

    @GetMapping("/{tenantId}/roles/{roleCode}")
    @RequirePermission(value = "tenant.roles.read", fullPermission = true)
    public RoleResponse getRole(@PathVariable UUID tenantId, @PathVariable String roleCode) {
        return access.getRole(tenantId, roleCode);
    }

    @PostMapping("/{tenantId}/roles")
    @RequirePermission(value = "tenant.roles.write", fullPermission = true)
    public ResponseEntity<RoleResponse> createRole(@PathVariable UUID tenantId, @Valid @RequestBody CreateRoleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(access.createRole(tenantId, request));
    }

    @PatchMapping("/{tenantId}/roles/{roleCode}")
    @RequirePermission(value = "tenant.roles.write", fullPermission = true)
    public RoleResponse updateRole(@PathVariable UUID tenantId, @PathVariable String roleCode,
                                   @Valid @RequestBody UpdateRoleRequest request) {
        return access.updateRole(tenantId, roleCode, request);
    }

    /** Same as PATCH — required by {@code nf-record-page}. */
    @PutMapping("/{tenantId}/roles/{roleCode}")
    @RequirePermission(value = "tenant.roles.write", fullPermission = true)
    public RoleResponse putRole(@PathVariable UUID tenantId, @PathVariable String roleCode,
                                @Valid @RequestBody UpdateRoleRequest request) {
        return access.updateRole(tenantId, roleCode, request);
    }

    @DeleteMapping("/{tenantId}/roles/{roleCode}")
    @RequirePermission(value = "tenant.roles.write", fullPermission = true)
    public ResponseEntity<Void> deleteRole(@PathVariable UUID tenantId, @PathVariable String roleCode) {
        access.deleteRole(tenantId, roleCode);
        return ResponseEntity.noContent().build();
    }

    /** Permissions an organization role can grant, grouped by module. */
    @GetMapping("/{tenantId}/permissions/catalog")
    @RequirePermission(value = "tenant.roles.read", fullPermission = true)
    public List<PermissionGroupResponse> getPermissionsCatalog(@PathVariable UUID tenantId) {
        return permissionMetadata.getAllPermissions();
    }

    @GetMapping("/{tenantId}/domains")
    @RequirePermission(value = "tenant.settings.read", fullPermission = true)
    public List<DomainToggleResponse> getDomains(@PathVariable UUID tenantId) {
        return access.getDomains(tenantId);
    }

    @PatchMapping("/{tenantId}/domains/{domainCode}")
    @RequirePermission(value = "tenant.settings.write", fullPermission = true)
    public DomainToggleResponse updateDomain(@PathVariable UUID tenantId, @PathVariable String domainCode,
                                             @Valid @RequestBody UpdateDomainRequest request) {
        return access.updateDomain(tenantId, domainCode, request.enabled());
    }
}
