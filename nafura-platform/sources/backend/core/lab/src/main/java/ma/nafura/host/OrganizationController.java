package ma.nafura.host;

import java.util.List;
import java.util.UUID;

import ma.nafura.platform.authorization.repository.TenantUserRoleRepository;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.repository.AppUserRepository;
import ma.nafura.platform.tenancy.domain.model.Tenant;
import ma.nafura.platform.tenancy.domain.model.TenantMembership;
import ma.nafura.platform.tenancy.repository.TenantMembershipRepository;
import ma.nafura.platform.tenancy.repository.TenantRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/** Organizations of the signed-in user, and the operator's create / suspend actions. */
@RestController
public class OrganizationController {

    private final OrganizationProvisioning provisioning;
    private final AppUserRepository users;
    private final TenantMembershipRepository memberships;
    private final TenantRepository tenants;
    private final TenantUserRoleRepository roles;

    public OrganizationController(
            OrganizationProvisioning provisioning,
            AppUserRepository users,
            TenantMembershipRepository memberships,
            TenantRepository tenants,
            TenantUserRoleRepository roles
    ) {
        this.provisioning = provisioning;
        this.users = users;
        this.memberships = memberships;
        this.tenants = tenants;
        this.roles = roles;
    }

    public record CreateOrganizationRequest(String name, String key, String adminEmail) {
    }

    @PostMapping("/api/tenants")
    public OrganizationProvisioning.Created create(@RequestBody CreateOrganizationRequest request) {
        return provisioning.create(request.name(), request.key(), request.adminEmail());
    }

    @PostMapping("/api/tenants/{tenantId}/suspend")
    @RequirePermission("platform.operator.organizations.update")
    public void suspend(@PathVariable UUID tenantId) {
        provisioning.setStatus(tenantId, "SUSPENDED");
    }

    @PostMapping("/api/tenants/{tenantId}/resume")
    @RequirePermission("platform.operator.organizations.update")
    public void resume(@PathVariable UUID tenantId) {
        provisioning.setStatus(tenantId, "ACTIVE");
    }

    public record OrganizationMembership(
            UUID id, String key, String name, String slug, String status, String audience, List<String> roles) {
    }

    @GetMapping("/api/v1/me/organizations")
    public List<OrganizationMembership> mine() {
        String email = UserContext.getUserEmail();
        if (email == null) {
            return List.of();
        }
        AppUser user = users.findByEmailIgnoreCase(email).orElse(null);
        if (user == null) {
            return List.of();
        }
        return memberships.findByUserId(user.getId()).stream().map(membership -> toView(membership, user.getId())).toList();
    }

    private OrganizationMembership toView(TenantMembership membership, UUID userId) {
        Tenant tenant = tenants.findById(membership.getTenantId()).orElse(null);
        if (tenant == null) {
            return new OrganizationMembership(membership.getTenantId(), null, null, null, null, membership.getAudience(), List.of());
        }
        List<String> roleCodes = roles.findRoleCodesByTenantIdAndUserId(tenant.getId(), userId);
        return new OrganizationMembership(
                tenant.getId(), tenant.getKey(), tenant.getName(), tenant.getSlug(),
                tenant.getStatus(), membership.getAudience(), roleCodes);
    }
}
