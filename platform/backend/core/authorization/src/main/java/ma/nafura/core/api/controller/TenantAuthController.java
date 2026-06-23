package ma.nafura.platform.authorization.api.controller;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.authorization.api.response.tenant.AuthRoleResponse;
import ma.nafura.platform.authorization.api.response.tenant.TenantMembershipResponse;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.tenancy.domain.model.Tenant;
import ma.nafura.platform.tenancy.domain.model.TenantDomain;
import ma.nafura.platform.tenancy.domain.model.TenantMembership;
import ma.nafura.platform.identity.repository.AppUserRepository;
import ma.nafura.platform.tenancy.repository.TenantDomainRepository;
import ma.nafura.platform.tenancy.repository.TenantMembershipRepository;
import ma.nafura.platform.tenancy.repository.TenantRepository;
import ma.nafura.platform.authorization.repository.TenantUserRoleRepository;
import ma.nafura.platform.authorization.service.PermissionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class TenantAuthController {

    private final AppUserRepository appUserRepository;
    private final TenantMembershipRepository tenantMembershipRepository;
    private final TenantRepository tenantRepository;
    private final TenantDomainRepository tenantDomainRepository;
    private final TenantUserRoleRepository tenantUserRoleRepository;
    private final PermissionService permissionService;

    @GetMapping("/tenants")
    public ResponseEntity<List<TenantMembershipResponse>> getUserTenants(@AuthenticationPrincipal Jwt jwt) {
        String email = jwt.getClaimAsString("email");

        AppUser appUser = appUserRepository.findByEmailIgnoreCase(email).orElse(null);
        if (appUser == null) {
            return ResponseEntity.ok(List.of());
        }

        List<TenantMembership> membershipsForUser = tenantMembershipRepository.findByUserId(appUser.getId());
        if (membershipsForUser.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        Map<String, Tenant> tenantsById = new HashMap<>();
        for (Tenant tenant : tenantRepository.findAllById(
                membershipsForUser.stream().map(TenantMembership::getTenantId).toList())) {
            tenantsById.put(tenant.getId().toString(), tenant);
        }

        List<TenantMembershipResponse> memberships = membershipsForUser.stream()
                .map(membership -> {
                    Tenant tenant = tenantsById.get(membership.getTenantId().toString());
                    if (tenant == null) {
                        return null;
                    }

                    List<String> roleCodes = tenantUserRoleRepository.findRoleCodesByTenantIdAndUserId(
                            membership.getTenantId(),
                            membership.getUserId());

                    List<AuthRoleResponse> roles = roleCodes.stream()
                            .map(roleCode -> AuthRoleResponse.fromRole(
                                    roleCode,
                                    permissionService.getPermissionsForRole(roleCode)))
                            .toList();

                    List<String> enabledDomains = buildEnabledFeatures(tenant);

                    return new TenantMembershipResponse(
                            tenant.getId().toString(),
                            tenant.getKey(),
                            tenant.getName(),
                            enabledDomains,
                            roles,
                            true,
                            tenant.getCreatedAt() != null ? tenant.getCreatedAt().toString() : null,
                            tenant.getUpdatedAt() != null ? tenant.getUpdatedAt().toString() : null,
                            membership.getCreatedAt() != null ? membership.getCreatedAt().toString() : null
                    );
                })
                .filter(m -> m != null)
                .collect(Collectors.toList());

        return ResponseEntity.ok(memberships);
    }

    /**
     * Builds the list of enabled feature/domain ids for a tenant.
     * Uses tenant_domain billing toggles (billable domains, e.g. "finance").
     */
    private List<String> buildEnabledFeatures(Tenant tenant) {
        Set<String> enabled = new LinkedHashSet<>();

        // 1. Tenant-domain (billable) enabled codes as-is (e.g. finance, geo, measurement)
        List<String> tenantDomains = tenantDomainRepository.findByTenantId(tenant.getId())
                .stream()
                .filter(domain -> "ACTIVE".equalsIgnoreCase(domain.getStatus()))
                .map(TenantDomain::getDomainCode)
                .toList();
        enabled.addAll(tenantDomains);

        return new ArrayList<>(enabled);
    }
}


