package ma.nafura.platform.authorization.api.controller;

import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.repository.AppUserRepository;
import ma.nafura.platform.tenancy.repository.TenantDomainRepository;
import ma.nafura.platform.tenancy.repository.TenantRepository;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * What the caller may do in the current organization: exactly what PermissionEnforcementFilter enforces.
 * Tenant-scoped on purpose (/api/auth/** runs without tenant context, hence without tenant roles).
 */
@RestController
@RequiredArgsConstructor
public class MyPermissionsController {

    private final ObjectProvider<TenantDomainRepository> tenantDomains;
    private final TenantRepository tenants;
    private final AppUserRepository users;

    /** {@code disabledDomains}: domains the organization switched off, refused whatever the role. */
    public record EffectivePermissionsResponse(Set<String> roles, Set<String> permissions, Set<String> disabledDomains) {
    }

    /** Who is signed in and in which organization, whatever signed them in (lab or OIDC). */
    public record SessionResponse(String email, String name, Set<String> roles, boolean superAdmin, String audience, Organization tenant) {
        public record Organization(UUID id, String key, String name) {
        }
    }

    @GetMapping("/api/v1/me/session")
    public SessionResponse getSession() {
        String email = UserContext.getUserEmail();
        String name = email == null ? null : users.findByEmailIgnoreCase(email).map(AppUser::getName).orElse(email);
        UUID tenantId = TenantContext.getTenantIdOrNull();
        SessionResponse.Organization tenant = tenantId == null ? null : tenants.findById(tenantId)
                .map(row -> new SessionResponse.Organization(row.getId(), row.getKey(), row.getName()))
                .orElse(null);
        return new SessionResponse(email, name, new TreeSet<>(UserContext.getUserRoles()), UserContext.isSuperAdmin(), UserContext.getAudience(), tenant);
    }

    @GetMapping("/api/v1/me/permissions")
    public EffectivePermissionsResponse getEffectivePermissions() {
        UUID tenantId = TenantContext.getTenantIdOrNull();
        TenantDomainRepository domains = tenantDomains.getIfAvailable();
        Set<String> disabled = new TreeSet<>();
        if (tenantId != null && domains != null) {
            domains.findByTenantId(tenantId).stream()
                    .filter(row -> !"ACTIVE".equalsIgnoreCase(row.getStatus()))
                    .forEach(row -> disabled.add(row.getDomainCode()));
        }
        return new EffectivePermissionsResponse(
                new TreeSet<>(UserContext.getUserRoles()),
                new TreeSet<>(UserContext.getPermissions()),
                disabled);
    }
}
