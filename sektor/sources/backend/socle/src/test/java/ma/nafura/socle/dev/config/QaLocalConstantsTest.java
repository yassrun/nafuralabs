package ma.nafura.socle.dev.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class QaLocalConstantsTest {

    @Test
    void defaultSession_isOwner() {
        assertThat(QaLocalConstants.resolveSessionEmail(null, null, null))
            .isEqualTo(QaLocalConstants.OWNER_EMAIL);
        assertThat(QaLocalConstants.resolveSessionEmail("", "", ""))
            .isEqualTo(QaLocalConstants.OWNER_EMAIL);
        assertThat(QaLocalConstants.resolveAuthEmail(QaLocalConstants.DEPRECATED_CURSOR_QA_EMAIL))
            .isEqualTo(QaLocalConstants.OWNER_EMAIL);
    }

    @Test
    void roleAlias_resolvesAllowlistedEmail() {
        assertThat(QaLocalConstants.resolveSessionEmail(null, null, "magasinier"))
            .isEqualTo("qa.magasinier@nafuralabs.local");
        assertThat(QaLocalConstants.resolveSessionEmail(null, null, "chef"))
            .isEqualTo("qa.chef-chantier@nafuralabs.local");
        assertThat(QaLocalConstants.resolveSessionEmail(null, null, "owner"))
            .isEqualTo(QaLocalConstants.OWNER_EMAIL);
    }

    @Test
    void requestedEmail_winsOverRole_whenAllowlisted() {
        assertThat(QaLocalConstants.resolveSessionEmail(
                null, "qa.dg@nafuralabs.local", "magasinier"))
            .isEqualTo("qa.dg@nafuralabs.local");
    }

    @Test
    void unknownRoleOrEmail_isRejected() {
        assertThatThrownBy(() -> QaLocalConstants.resolveSessionEmail(null, null, "pointeur"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("pointeur");
        assertThatThrownBy(() -> QaLocalConstants.resolveSessionEmail(null, "evil@example.com", null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("evil@example.com");
    }

    @Test
    void roster_hasUniqueEmailsAndAliases() {
        Set<String> emails = new HashSet<>();
        Set<String> aliases = new HashSet<>();
        emails.add(QaLocalConstants.OWNER_EMAIL.toLowerCase());
        aliases.add(QaLocalConstants.OWNER_ALIAS);
        for (QaLocalConstants.RoleUser user : QaLocalConstants.ROLE_USERS) {
            assertThat(emails.add(user.email().toLowerCase())).isTrue();
            assertThat(aliases.add(user.alias())).isTrue();
            assertThat(user.tenantRoleCode()).startsWith("BTP_");
            assertThat(QaLocalConstants.isAllowlistedEmail(user.email())).isTrue();
        }
        assertThat(QaLocalConstants.ROLE_USERS).hasSize(7);
        assertThat(QaLocalConstants.isOwnerEmail(QaLocalConstants.OWNER_EMAIL)).isTrue();
        assertThat(QaLocalConstants.isOwnerEmail("qa.magasinier@nafuralabs.local")).isFalse();
    }
}
