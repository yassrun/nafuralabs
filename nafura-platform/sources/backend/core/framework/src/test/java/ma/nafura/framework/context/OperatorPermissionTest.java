package ma.nafura.platform.framework.context;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

class OperatorPermissionTest {

    @AfterEach
    void clean() {
        UserContext.clear();
    }

    @Test
    void roleWildcardsAndSuperAdminNeverCoverTheOperator() {
        UserContext.setSuperAdmin(true);
        UserContext.setPermissions(Set.of("*"));
        assertThat(UserContext.hasPermission("demo.purchasing.supplier.read")).isTrue();
        assertThat(UserContext.hasPermission("platform.operator.organizations.create")).isFalse();

        UserContext.setSuperAdmin(false);
        UserContext.setPermissions(Set.of("platform.*"));
        assertThat(UserContext.hasPermission("platform.audit.read")).isTrue();
        assertThat(UserContext.hasPermission("platform.operator.organizations.create")).isFalse();

        UserContext.setPermissions(Set.of("*", "platform.operator.*"));
        assertThat(UserContext.hasPermission("platform.operator.organizations.create")).isTrue();
    }
}
