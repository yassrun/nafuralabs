package ma.nafura.lab;

import java.util.UUID;

import ma.nafura.platform.authorization.domain.model.UserRole;
import ma.nafura.platform.authorization.repository.UserRoleRepository;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.service.AppUserProvisioningService;
import ma.nafura.platform.scope.security.scope.DefaultScopeService;
import ma.nafura.platform.tenancy.repository.TenantRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeds the lab roster. In {@code single}, everyone joins the one organization.
 * In {@code multi}, each user joins the organizations listed on {@code spec.local.users[].organizations}.
 * Idempotent: an existing membership is left as the organization admin set it.
 */
@Order(40)
public class LabSeeder implements ApplicationRunner {

    private final LabProperties properties;
    private final DefaultScopeService defaultScopeService;
    private final TenantRepository tenantRepository;
    private final boolean multi;
    private final JdbcTemplate jdbcTemplate;
    private final AppUserProvisioningService appUserProvisioningService;
    private final UserRoleRepository userRoleRepository;

    public LabSeeder(
            LabProperties properties,
            DefaultScopeService defaultScopeService,
            TenantRepository tenantRepository,
            boolean multi,
            JdbcTemplate jdbcTemplate,
            AppUserProvisioningService appUserProvisioningService,
            UserRoleRepository userRoleRepository
    ) {
        this.properties = properties;
        this.defaultScopeService = defaultScopeService;
        this.tenantRepository = tenantRepository;
        this.multi = multi;
        this.jdbcTemplate = jdbcTemplate;
        this.appUserProvisioningService = appUserProvisioningService;
        this.userRoleRepository = userRoleRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (multi) {
            seedMulti();
        } else {
            seedSingle();
        }
    }

    private void seedSingle() {
        UUID tenantId = defaultScopeService.resolveDefaultScopeId();
        for (LabProperties.User labUser : properties.users()) {
            AppUser user = provision(labUser);
            seedMembership(tenantId, user.getId(), labUser.role(), "members");
        }
    }

    private void seedMulti() {
        for (LabProperties.User labUser : properties.users()) {
            AppUser user = provision(labUser);
            for (LabProperties.Membership membership : labUser.organizations()) {
                UUID tenantId = tenantRepository.findByKey(membership.key())
                        .orElseThrow(() -> new IllegalStateException(
                                labUser.email() + " belongs to unknown organization " + membership.key()))
                        .getId();
                String role = membership.role() == null || membership.role().isBlank() ? labUser.role() : membership.role();
                String audience = membership.audience() == null || membership.audience().isBlank() ? "members" : membership.audience();
                seedMembership(tenantId, user.getId(), role, audience);
            }
        }
    }

    private AppUser provision(LabProperties.User labUser) {
        AppUser user = appUserProvisioningService.provisionAuthenticatedUser(
                labUser.email(), labUser.givenName(), labUser.familyName());
        if (labUser.superAdmin() && !userRoleRepository.existsByUserIdAndRoleCode(user.getId(), "SUPER_ADMIN")) {
            userRoleRepository.save(UserRole.builder().userId(user.getId()).roleCode("SUPER_ADMIN").build());
        }
        return user;
    }

    /** First boot only: afterwards the tenant admin owns memberships and role assignments. */
    private void seedMembership(UUID tenantId, UUID userId, String role, String audience) {
        int inserted = jdbcTemplate.update(
                """
                INSERT INTO tenant_membership (id, tenant_id, user_id, status, audience, created_at, updated_at)
                VALUES (?, ?, ?, 'ACTIVE', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT (tenant_id, user_id) DO NOTHING
                """,
                UUID.randomUUID(), tenantId, userId, audience);
        if (inserted == 1 && role != null && !"SUPER_ADMIN".equals(role)) {
            jdbcTemplate.update(
                    """
                    INSERT INTO tenant_user_role (id, tenant_id, user_id, role_code, created_at, updated_at)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    ON CONFLICT (tenant_id, user_id, role_code) DO NOTHING
                    """,
                    UUID.randomUUID(), tenantId, userId, role);
        }
    }
}
