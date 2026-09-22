package ma.nafura.sandbox.lab;

import java.util.UUID;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import ma.nafura.platform.scope.security.scope.DefaultScopeService;
import ma.nafura.platform.tenancy.repository.TenantRepository;

/**
 * Aligns a real tenant row on the single-scope id so tenant prefs (app-settings) can resolve.
 */
@Component
@Order(40)
public class SandboxTenantSeeder implements ApplicationRunner {

    private final DefaultScopeService defaultScopeService;
    private final TenantRepository tenantRepository;
    private final JdbcTemplate jdbcTemplate;

    public SandboxTenantSeeder(
            DefaultScopeService defaultScopeService,
            TenantRepository tenantRepository,
            JdbcTemplate jdbcTemplate
    ) {
        this.defaultScopeService = defaultScopeService;
        this.tenantRepository = tenantRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
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
                "sandbox",
                "Sandbox",
                "LAB",
                SandboxLabUsers.ADMIN_EMAIL,
                "sandbox"
        );
    }
}
