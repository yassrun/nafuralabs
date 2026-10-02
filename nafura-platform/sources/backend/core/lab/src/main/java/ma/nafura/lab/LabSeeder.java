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

/** Seeds the single-scope tenant row, then the roster. Idempotent. */
@Order(40)
public class LabSeeder implements ApplicationRunner {

    private final LabProperties properties;
    private final String applicationId;
    private final DefaultScopeService defaultScopeService;
    private final TenantRepository tenantRepository;
    private final JdbcTemplate jdbcTemplate;
    private final AppUserProvisioningService appUserProvisioningService;
    private final UserRoleRepository userRoleRepository;

    public LabSeeder(
            LabProperties properties,
            String applicationId,
            DefaultScopeService defaultScopeService,
            TenantRepository tenantRepository,
            JdbcTemplate jdbcTemplate,
            AppUserProvisioningService appUserProvisioningService,
            UserRoleRepository userRoleRepository
    ) {
        this.properties = properties;
        this.applicationId = applicationId;
        this.defaultScopeService = defaultScopeService;
        this.tenantRepository = tenantRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.appUserProvisioningService = appUserProvisioningService;
        this.userRoleRepository = userRoleRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedTenant();
        seedUsers();
    }

    private void seedTenant() {
        UUID scopeId = defaultScopeService.resolveDefaultScopeId();
        if (tenantRepository.findById(scopeId).isPresent()) {
            return;
        }
        jdbcTemplate.update(
                """
                INSERT INTO tenant (id, tenant_key, name, type, owner_email, application_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """,
                scopeId,
                properties.tenant().key(),
                properties.tenant().name(),
                "LAB",
                properties.users().get(0).email(),
                applicationId
        );
    }

    private void seedUsers() {
        UUID tenantId = defaultScopeService.resolveDefaultScopeId();
        for (LabProperties.User labUser : properties.users()) {
            AppUser user = appUserProvisioningService.provisionAuthenticatedUser(
                    labUser.email(), labUser.givenName(), labUser.familyName());
            if (labUser.superAdmin() && !userRoleRepository.existsByUserIdAndRoleCode(user.getId(), "SUPER_ADMIN")) {
                userRoleRepository.save(UserRole.builder().userId(user.getId()).roleCode("SUPER_ADMIN").build());
            }
            seedMembership(tenantId, user.getId(), labUser);
        }
    }

    /** First boot only: afterwards the tenant admin owns memberships and role assignments. */
    private void seedMembership(UUID tenantId, UUID userId, LabProperties.User labUser) {
        int inserted = jdbcTemplate.update(
                """
                INSERT INTO tenant_membership (id, tenant_id, user_id, status, created_at, updated_at)
                VALUES (?, ?, ?, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT (tenant_id, user_id) DO NOTHING
                """,
                UUID.randomUUID(), tenantId, userId);
        if (inserted == 1 && !labUser.superAdmin()) {
            jdbcTemplate.update(
                    """
                    INSERT INTO tenant_user_role (id, tenant_id, user_id, role_code, created_at, updated_at)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    ON CONFLICT (tenant_id, user_id, role_code) DO NOTHING
                    """,
                    UUID.randomUUID(), tenantId, userId, labUser.role());
        }
    }
}
