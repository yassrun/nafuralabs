package ma.nafura.chantiers.domain.chantier;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ChantierRoleCodesTest {

    @Test
    void normalize_mapsLegacyAliases() {
        assertThat(ChantierRoleCodes.normalize("CONDUCTEUR_TRAVAUX"))
                .isEqualTo(ChantierRoleCodes.BTP_CONDUCTEUR_TRAVAUX);
        assertThat(ChantierRoleCodes.normalize("DG")).isEqualTo(ChantierRoleCodes.BTP_DG);
        assertThat(ChantierRoleCodes.normalize("COMITE")).isEqualTo(ChantierRoleCodes.BTP_DG);
    }

    @Test
    void scopeType_classifiesFamilies() {
        assertThat(ChantierRoleCodes.scopeType(ChantierRoleCodes.BTP_CHEF_CHANTIER))
                .isEqualTo(ChantierRoleCodes.SCOPE_CHANTIER);
        assertThat(ChantierRoleCodes.scopeType(ChantierRoleCodes.BTP_DG))
                .isEqualTo(ChantierRoleCodes.SCOPE_ENTREPRISE);
        assertThat(ChantierRoleCodes.scopeType(ChantierRoleCodes.BTP_MAGASINIER))
                .isEqualTo(ChantierRoleCodes.SCOPE_BOTH);
    }

    @Test
    void hierarchy_returnsNextHigherRole() {
        assertThat(ChantierRoleCodes.nextHigherRole(ChantierRoleCodes.BTP_CHEF_CHANTIER))
                .isEqualTo(ChantierRoleCodes.BTP_CONDUCTEUR_TRAVAUX);
        assertThat(ChantierRoleCodes.nextHigherRole(ChantierRoleCodes.BTP_DG)).isNull();
    }

    @Test
    void isAffectable_onlyChantierFamily() {
        assertThat(ChantierRoleCodes.isAffectable(ChantierRoleCodes.BTP_POINTEUR)).isTrue();
        assertThat(ChantierRoleCodes.isAffectable(ChantierRoleCodes.BTP_DG)).isFalse();
    }
}
