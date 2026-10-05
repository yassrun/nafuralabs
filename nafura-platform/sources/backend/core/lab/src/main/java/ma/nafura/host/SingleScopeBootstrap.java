package ma.nafura.host;

import java.util.List;
import java.util.UUID;

import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.repository.AppUserRepository;
import ma.nafura.platform.identity.service.AppUserProvisioningService;
import ma.nafura.platform.scope.security.scope.DefaultScopeService;
import ma.nafura.platform.tenancy.repository.TenantRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

/**
 * A single-organization product has exactly one tenant row (key = application id) and owners declared by the
 * deployment ({@code nafura.access.owners}): an owner holds the declared {@code OWNER} role there. Idempotent;
 * every other membership is managed in the app by its owners.
 */
@Order(30)
public class SingleScopeBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SingleScopeBootstrap.class);

    private final String applicationId;
    private final String applicationName;
    private final List<String> owners;
    private final DefaultScopeService defaultScopeService;
    private final TenantRepository tenantRepository;
    private final AppUserRepository appUserRepository;
    private final AppUserProvisioningService appUserProvisioningService;
    private final JdbcTemplate jdbcTemplate;

    public SingleScopeBootstrap(
            String applicationId,
            String applicationName,
            List<String> owners,
            DefaultScopeService defaultScopeService,
            TenantRepository tenantRepository,
            AppUserRepository appUserRepository,
            AppUserProvisioningService appUserProvisioningService,
            JdbcTemplate jdbcTemplate
    ) {
        this.applicationId = applicationId;
        this.applicationName = applicationName;
        this.owners = owners.stream().map(String::trim).filter(email -> !email.isEmpty()).toList();
        this.defaultScopeService = defaultScopeService;
        this.tenantRepository = tenantRepository;
        this.appUserRepository = appUserRepository;
        this.appUserProvisioningService = appUserProvisioningService;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        UUID tenantId = defaultScopeService.resolveDefaultScopeId();
        ensureTenant(tenantId);
        owners.forEach(email -> ensureOwner(tenantId, email));
    }

    private void ensureTenant(UUID tenantId) {
        if (tenantRepository.findById(tenantId).isPresent()) {
            return;
        }
        jdbcTemplate.update(
                """
                INSERT INTO tenant (id, tenant_key, name, type, owner_email, application_id, slug, status, created_at, updated_at)
                VALUES (?, ?, ?, 'SINGLE', ?, ?, ?, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """,
                tenantId, applicationId, applicationName, owners.isEmpty() ? null : owners.get(0), applicationId, applicationId);
        log.info("Created the organization of {} ({})", applicationId, tenantId);
    }

    private void ensureOwner(UUID tenantId, String email) {
        // Existing users keep the name their identity provider gave them.
        AppUser user = appUserRepository.findByEmailIgnoreCase(email)
                .orElseGet(() -> appUserProvisioningService.provisionAuthenticatedUser(email));
        jdbcTemplate.update(
                """
                INSERT INTO tenant_membership (id, tenant_id, user_id, status, created_at, updated_at)
                VALUES (?, ?, ?, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT (tenant_id, user_id) DO UPDATE SET status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP
                """,
                UUID.randomUUID(), tenantId, user.getId());
        int granted = jdbcTemplate.update(
                """
                INSERT INTO tenant_user_role (id, tenant_id, user_id, role_code, created_at, updated_at)
                VALUES (?, ?, ?, 'OWNER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT (tenant_id, user_id, role_code) DO NOTHING
                """,
                UUID.randomUUID(), tenantId, user.getId());
        if (granted == 1) {
            log.info("{} is an owner of {}", email, applicationId);
        }
    }
}
