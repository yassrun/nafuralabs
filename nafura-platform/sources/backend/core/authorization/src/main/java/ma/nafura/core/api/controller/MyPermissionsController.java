package ma.nafura.platform.authorization.api.controller;

import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.platform.tenancy.repository.TenantDomainRepository;
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

    /** {@code disabledDomains}: domains the organization switched off, refused whatever the role. */
    public record EffectivePermissionsResponse(Set<String> roles, Set<String> permissions, Set<String> disabledDomains) {
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
