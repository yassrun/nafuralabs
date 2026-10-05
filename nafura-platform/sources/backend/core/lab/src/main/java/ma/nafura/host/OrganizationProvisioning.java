package ma.nafura.host;

import java.util.List;
import java.util.UUID;

import ma.nafura.host.seed.TenantSeeder;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.service.AppUserProvisioningService;
import ma.nafura.platform.tenancy.domain.model.Tenant;
import ma.nafura.platform.tenancy.repository.TenantRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Creates an organization, applies its reference data, and invites its administrator.
 * Who may call it depends on {@code spec.runtime.signup}: {@code operator} (default) or {@code open}.
 */
public class OrganizationProvisioning {

    private static final Logger log = LoggerFactory.getLogger(OrganizationProvisioning.class);

    private final String applicationId;
    private final String signup;
    private final TenantRepository tenants;
    private final TenantSeeder seeder;
    private final AppUserProvisioningService users;
    private final JdbcTemplate jdbc;

    public OrganizationProvisioning(
            String applicationId,
            String signup,
            TenantRepository tenants,
            TenantSeeder seeder,
            AppUserProvisioningService users,
            JdbcTemplate jdbc
    ) {
        this.applicationId = applicationId;
        this.signup = signup == null || signup.isBlank() ? "operator" : signup;
        this.tenants = tenants;
        this.seeder = seeder;
        this.users = users;
        this.jdbc = jdbc;
    }

    public boolean operatorOnly() {
        return !"open".equalsIgnoreCase(signup);
    }

    @Transactional
    public Created create(String name, String key, String adminEmail) {
        boolean operator = UserContext.hasPermission("platform.operator.organizations.create");
        if (operatorOnly() && !operator) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Permission denied: platform.operator.organizations.create");
        }
        if (!operator) {
            // Open signup: one creates an organization for oneself, never on behalf of someone else.
            String caller = UserContext.getUserEmail();
            if (caller == null || caller.isBlank()) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in to create an organization");
            }
            if (adminEmail != null && !adminEmail.isBlank() && !adminEmail.trim().equalsIgnoreCase(caller.trim())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the product operator names another owner");
            }
            adminEmail = caller;
        }
        if (name == null || name.isBlank() || key == null || !key.matches("[a-z][a-z0-9-]*") || adminEmail == null || !adminEmail.contains("@")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name, key and adminEmail are required");
        }
        if (tenants.findByKey(key).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Organization already exists");
        }
        Tenant tenant = tenants.save(Tenant.builder()
                .key(key)
                .name(name.trim())
                .type("MULTI")
                .ownerEmail(adminEmail.trim())
                .applicationId(applicationId)
                .slug(key)
                .status("ACTIVE")
                .build());
        List<String> seeded = seeder.seed(tenant.getId()).stream().map(TenantSeeder.Applied::dataset).toList();
        // The audit flush runs at commit, after seeding has restored the previous (empty) context.
        TenantContext.setTenantId(tenant.getId());
        AppUser admin = users.provisionAuthenticatedUser(adminEmail.trim());
        invite(tenant, admin);
        return new Created(tenant.getId(), tenant.getKey(), tenant.getName(), tenant.getSlug(), seeded);
    }

    @Transactional
    public void setStatus(UUID tenantId, String status) {
        if (!UserContext.hasPermission("platform.operator.organizations.update")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Permission denied: platform.operator.organizations.update");
        }
        Tenant tenant = tenants.findById(tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Organization not found"));
        tenant.setStatus(status);
        tenants.save(tenant);
        log.info("Organization {} is now {}", tenant.getKey(), status);
    }

    private void invite(Tenant tenant, AppUser admin) {
        jdbc.update(
                """
                INSERT INTO tenant_membership (id, tenant_id, user_id, status, audience, created_at, updated_at)
                VALUES (?, ?, ?, 'INVITED', 'members', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT (tenant_id, user_id) DO NOTHING
                """,
                UUID.randomUUID(), tenant.getId(), admin.getId());
        jdbc.update(
                """
                INSERT INTO tenant_user_role (id, tenant_id, user_id, role_code, created_at, updated_at)
                VALUES (?, ?, ?, 'OWNER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT (tenant_id, user_id, role_code) DO NOTHING
                """,
                UUID.randomUUID(), tenant.getId(), admin.getId());
        String link = "/invite/accept?token=lab-" + tenant.getId();
        log.info("Invitation de {} à l'organisation {} ({}) : {}", admin.getEmail(), tenant.getName(), tenant.getKey(), link);
    }

    public record Created(UUID id, String key, String name, String slug, List<String> seeded) {
    }
}
