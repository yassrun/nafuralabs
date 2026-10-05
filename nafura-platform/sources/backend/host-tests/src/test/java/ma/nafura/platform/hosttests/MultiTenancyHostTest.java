package ma.nafura.platform.hosttests;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import ma.nafura.host.seed.TenantSeeder;
import ma.nafura.platform.authorization.service.PermissionService;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.platform.scope.security.scope.DefaultScopeService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * The probe fixture stays {@code single}. Creating another organization still seeds its reference data,
 * and a row written there is not visible from the fixture's organization.
 * Operator permissions are not implied by {@code *} or by the super-admin flag.
 */
@SpringBootTest(classes = AllCapabilitiesApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class MultiTenancyHostTest {

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private TenantSeeder seeder;

    @Autowired
    private DefaultScopeService scopes;

    @Autowired
    private PermissionService permissionService;

    @Value("${nafura.security.tenant.mode}")
    private String mode;

    @Test
    void probeFixtureStaysSingleWhileANewOrganizationIsSeededApart() {
        assertThat(mode).isEqualTo("single");
        UUID home = scopes.resolveDefaultScopeId();
        UUID other = UUID.randomUUID();
        String key = "org-" + other.toString().replace("-", "").substring(0, 12);
        jdbc.update("""
                INSERT INTO tenant (id, tenant_key, name, type, application_id, slug, status, created_at, updated_at)
                VALUES (?, ?, 'Organisation autre', 'MULTI', 'platform-host-tests', ?, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """, other, key, key);

        assertThat(seeder.seed(other)).isNotEmpty();
        assertThat(jdbc.queryForList("SELECT code FROM probe_group WHERE tenant_id = ? ORDER BY code", String.class, other))
                .containsExactly("G1", "G2");

        jdbc.update("UPDATE probe_group SET code = 'ONLY-OTHER' WHERE tenant_id = ? AND code = 'G1'", other);
        assertThat(jdbc.queryForObject(
                "SELECT count(*) FROM probe_group WHERE tenant_id = ? AND code = 'ONLY-OTHER'", Integer.class, home)).isZero();
        assertThat(jdbc.queryForObject(
                "SELECT count(*) FROM probe_group WHERE tenant_id = ? AND code = 'G1'", Integer.class, home)).isEqualTo(1);
    }

    @Test
    void operatorPermissionIsNotARoleWildcard() {
        try {
            UserContext.setSuperAdmin(true);
            UserContext.setPermissions(java.util.Set.of("*"));
            assertThat(UserContext.hasPermission("platform.operator.organizations.create")).isFalse();
            UserContext.setPermissions(java.util.Set.of("platform.operator.*"));
            assertThat(UserContext.hasPermission("platform.operator.organizations.create")).isTrue();
        } finally {
            UserContext.clear();
        }
    }

    @Test
    void noRoleGrantsAnOperatorPermissionEvenWithAWildcard() {
        assertThat(permissionService.hasPermission("OWNER", "platform.operator.organizations.create")).isFalse();
        assertThat(permissionService.hasPermission("ORG_ADMIN", "platform.operator.organizations.update")).isFalse();
    }
}
