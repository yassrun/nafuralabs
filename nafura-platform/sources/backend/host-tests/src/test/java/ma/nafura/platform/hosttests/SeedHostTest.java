package ma.nafura.platform.hosttests;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import ma.nafura.host.seed.TenantSeeder;
import ma.nafura.platform.scope.security.scope.DefaultScopeService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * The probe-bc fixture ships a reference data set (groups) and a demo one (records referencing groups, one submitted).
 * The lab seeds both at startup; seeding again changes nothing, and never brings back what the organization deleted.
 */
@SpringBootTest(classes = AllCapabilitiesApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class SeedHostTest {

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private TenantSeeder seeder;

    @Autowired
    private DefaultScopeService scopes;

    @Test
    void referenceAndDemoDataAreSeededThroughTheRecordRules() {
        UUID tenant = scopes.resolveDefaultScopeId();

        assertThat(jdbc.queryForList("SELECT code FROM probe_group WHERE tenant_id = ? ORDER BY code", String.class, tenant))
                .containsExactly("G1", "G2");
        List<Map<String, Object>> records = jdbc.queryForList("""
                SELECT r.code, r.status, g.code AS group_code FROM probe_record r JOIN probe_group g ON g.id = r.group_id
                WHERE r.tenant_id = ? ORDER BY r.code
                """, tenant);
        assertThat(records).extracting(row -> row.get("code") + ":" + row.get("status") + ":" + row.get("group_code"))
                .containsExactly("R-1:DRAFT:G1", "R-2:APPROVED:G2");
        assertThat(jdbc.queryForList("SELECT dataset_id FROM nafura_seed WHERE tenant_id = ? ORDER BY dataset_id", String.class, tenant))
                .contains("probe.groups", "probe.records");
    }

    @Test
    void seedingAgainCreatesNothingAndKeepsDeletionsDeleted() {
        UUID tenant = scopes.resolveDefaultScopeId();

        assertThat(seeder.seed(tenant)).isEmpty();

        jdbc.update("DELETE FROM probe_record WHERE tenant_id = ? AND code = 'R-1'", tenant);
        assertThat(seeder.seed(tenant)).isEmpty();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM probe_record WHERE tenant_id = ? AND code = 'R-1'", Integer.class, tenant))
                .isZero();

        // A changed data set is applied again: only the missing keys are created.
        jdbc.update("UPDATE nafura_seed SET checksum = 'changed' WHERE tenant_id = ? AND dataset_id = 'probe.records'", tenant);
        assertThat(seeder.seed(tenant)).containsExactly(new TenantSeeder.Applied("probe.records", 1));
        assertThat(jdbc.queryForObject("SELECT count(*) FROM probe_record WHERE tenant_id = ?", Integer.class, tenant)).isEqualTo(2);
    }
}
