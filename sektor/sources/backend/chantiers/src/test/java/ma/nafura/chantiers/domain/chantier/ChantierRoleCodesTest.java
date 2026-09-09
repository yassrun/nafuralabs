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

    @Test
    void commandGrade_placesOperationalRolesOnTheScale() {
        assertThat(ChantierRoleCodes.commandGrade(ChantierRoleCodes.BTP_POINTEUR))
                .isEqualTo(ChantierRoleCodes.COMMAND_GRADE_FIELD);
        assertThat(ChantierRoleCodes.commandGrade(ChantierRoleCodes.BTP_INGENIEUR))
                .isEqualTo(ChantierRoleCodes.COMMAND_GRADE_SITE);
        assertThat(ChantierRoleCodes.commandGrade(ChantierRoleCodes.BTP_DAF))
                .isEqualTo(ChantierRoleCodes.COMMAND_GRADE_NONE);
        assertThat(ChantierRoleCodes.commandGrade("OWNER"))
                .isEqualTo(ChantierRoleCodes.COMMAND_GRADE_DIRECTION);
        assertThat(ChantierRoleCodes.PLANNING_STRUCTURE_APPLY_MIN)
                .isEqualTo(ChantierRoleCodes.COMMAND_GRADE_CONDUCTEUR);
        assertThat(ChantierRoleCodes.PLANNING_CALENDAR_ADMIN_MIN)
                .isEqualTo(ChantierRoleCodes.COMMAND_GRADE_DIRECTEUR);
    }

    @Test
    void canCommand_isStrictlyAboveAndCascades() {
        int dt = ChantierRoleCodes.COMMAND_GRADE_DIRECTEUR;
        int conducteur = ChantierRoleCodes.COMMAND_GRADE_CONDUCTEUR;
        int chef = ChantierRoleCodes.COMMAND_GRADE_SITE;
        int field = ChantierRoleCodes.COMMAND_GRADE_FIELD;
        int direction = ChantierRoleCodes.COMMAND_GRADE_DIRECTION;

        assertThat(ChantierRoleCodes.canCommand(dt, ChantierRoleCodes.BTP_CONDUCTEUR_TRAVAUX)).isTrue();
        assertThat(ChantierRoleCodes.canCommand(dt, ChantierRoleCodes.BTP_CHEF_CHANTIER)).isTrue();
        assertThat(ChantierRoleCodes.canCommand(dt, ChantierRoleCodes.BTP_DIRECTEUR_TRAVAUX)).isFalse();
        assertThat(ChantierRoleCodes.canCommand(conducteur, ChantierRoleCodes.BTP_DIRECTEUR_TRAVAUX))
                .isFalse();
        assertThat(ChantierRoleCodes.canCommand(conducteur, ChantierRoleCodes.BTP_CHEF_CHANTIER)).isTrue();
        assertThat(ChantierRoleCodes.canCommand(chef, ChantierRoleCodes.BTP_CHEF_EQUIPE)).isTrue();
        assertThat(ChantierRoleCodes.canCommand(chef, ChantierRoleCodes.BTP_CHEF_CHANTIER)).isFalse();
        assertThat(ChantierRoleCodes.canCommand(field, ChantierRoleCodes.BTP_POINTEUR)).isFalse();
        assertThat(ChantierRoleCodes.canCommand(direction, ChantierRoleCodes.BTP_DIRECTEUR_TRAVAUX))
                .isTrue();
    }

    @Test
    void rolesCommandableBy_excludesPeersAndAbove() {
        assertThat(ChantierRoleCodes.rolesCommandableBy(ChantierRoleCodes.COMMAND_GRADE_CONDUCTEUR))
                .contains(
                        ChantierRoleCodes.BTP_CHEF_CHANTIER,
                        ChantierRoleCodes.BTP_CHEF_EQUIPE,
                        ChantierRoleCodes.BTP_INGENIEUR)
                .doesNotContain(
                        ChantierRoleCodes.BTP_CONDUCTEUR_TRAVAUX, ChantierRoleCodes.BTP_DIRECTEUR_TRAVAUX);
        assertThat(ChantierRoleCodes.rolesCommandableBy(ChantierRoleCodes.COMMAND_GRADE_FIELD)).isEmpty();
    }
}
