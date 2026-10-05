package ma.nafura.host;

import java.util.UUID;

import ma.nafura.lab.LabProperties;
import ma.nafura.platform.tenancy.repository.TenantRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

/**
 * A multi-organization product creates the lab organizations declared in {@code spec.local.organizations}.
 * Owners of a single-organization product stay on {@link SingleScopeBootstrap}. Idempotent.
 */
@Order(30)
public class MultiScopeBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(MultiScopeBootstrap.class);

    private final String applicationId;
    private final LabProperties labProperties;
    private final TenantRepository tenantRepository;
    private final JdbcTemplate jdbcTemplate;

    public MultiScopeBootstrap(
            String applicationId,
            LabProperties labProperties,
            TenantRepository tenantRepository,
            JdbcTemplate jdbcTemplate
    ) {
        this.applicationId = applicationId;
        this.labProperties = labProperties;
        this.tenantRepository = tenantRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (LabProperties.Organization organization : labProperties.organizations()) {
            ensureOrganization(organization);
        }
    }

    private void ensureOrganization(LabProperties.Organization organization) {
        if (organization.key() == null || organization.key().isBlank()) {
            throw new IllegalStateException("A lab organization needs a key");
        }
        if (tenantRepository.findByKey(organization.key()).isPresent()) {
            return;
        }
        UUID id = UUID.randomUUID();
        jdbcTemplate.update(
                """
                INSERT INTO tenant (id, tenant_key, name, type, application_id, slug, status, created_at, updated_at)
                VALUES (?, ?, ?, 'MULTI', ?, ?, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """,
                id, organization.key(), organization.name(), applicationId, organization.key());
        log.info("Created organization {} ({}) for {}", organization.name(), organization.key(), applicationId);
    }
}
