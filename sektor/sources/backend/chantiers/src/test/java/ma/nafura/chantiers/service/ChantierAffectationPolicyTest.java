package ma.nafura.chantiers.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.domain.chantier.ChantierAffectation;
import ma.nafura.chantiers.domain.chantier.ChantierRoleCodes;
import ma.nafura.chantiers.repository.ChantierAffectationRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.rh.domain.employe.Employe;
import ma.nafura.rh.repository.EmployeRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class ChantierAffectationPolicyTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final UUID USER = UUID.fromString("00000000-0000-4000-8000-0000000000aa");
    private static final String CHANTIER = "ch-1";
    private static final String EMPLOYE = "emp-1";

    @Mock private ChantierAffectationRepository affectationRepository;
    @Mock private EmployeRepository employeRepository;

    private ChantierAffectationPolicy policy;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        policy = new ChantierAffectationPolicy(affectationRepository, employeRepository);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        UserContext.clear();
    }

    @Test
    void ownerHasDirectionOnEveryChantier() {
        UserContext.setUserRole("OWNER");
        assertThat(policy.actorGradeOn(CHANTIER)).isEqualTo(ChantierRoleCodes.COMMAND_GRADE_DIRECTION);
        assertThat(policy.assignableRoles(CHANTIER)).contains(ChantierRoleCodes.BTP_DIRECTEUR_TRAVAUX);
    }

    @Test
    void dgIamHasDirectionWithoutAffectation() {
        UserContext.setUserRole(ChantierRoleCodes.BTP_DG);
        UserContext.setUserId(USER);
        assertThat(policy.canMutate(CHANTIER, ChantierRoleCodes.BTP_DIRECTEUR_TRAVAUX)).isTrue();
    }

    @Test
    void directeurAffecteCanAppointConducteurNotPeer() {
        UserContext.setUserRole(ChantierRoleCodes.BTP_DIRECTEUR_TRAVAUX);
        UserContext.setUserId(USER);
        stubAffectation(ChantierRoleCodes.BTP_DIRECTEUR_TRAVAUX);

        assertThat(policy.canMutate(CHANTIER, ChantierRoleCodes.BTP_CONDUCTEUR_TRAVAUX)).isTrue();
        assertThat(policy.canMutate(CHANTIER, ChantierRoleCodes.BTP_CHEF_CHANTIER)).isTrue();
        assertThat(policy.canMutate(CHANTIER, ChantierRoleCodes.BTP_DIRECTEUR_TRAVAUX)).isFalse();
        assertThat(policy.assignableRoles(CHANTIER))
                .doesNotContain(ChantierRoleCodes.BTP_DIRECTEUR_TRAVAUX);
    }

    @Test
    void iamDirecteurWithoutNominationHasNoAuthority() {
        UserContext.setUserRole(ChantierRoleCodes.BTP_DIRECTEUR_TRAVAUX);
        UserContext.setUserId(USER);
        when(employeRepository.findByTenantIdAndUserId(TENANT, USER))
                .thenReturn(Optional.of(Employe.builder().id(EMPLOYE).build()));
        when(affectationRepository.findActiveForEmployeOnDate(eq(TENANT), eq(EMPLOYE), any(LocalDate.class)))
                .thenReturn(List.of());

        assertThat(policy.actorGradeOn(CHANTIER)).isEqualTo(ChantierRoleCodes.COMMAND_GRADE_NONE);
        assertThatThrownBy(() -> policy.assertCanMutate(CHANTIER, ChantierRoleCodes.BTP_CHEF_CHANTIER))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining(ChantierAffectationPolicy.REFUS_CODE);
    }

    @Test
    void conducteurCannotAppointDirecteur() {
        UserContext.setUserId(USER);
        stubAffectation(ChantierRoleCodes.BTP_CONDUCTEUR_TRAVAUX);

        assertThat(policy.canMutate(CHANTIER, ChantierRoleCodes.BTP_CHEF_CHANTIER)).isTrue();
        assertThat(policy.canMutate(CHANTIER, ChantierRoleCodes.BTP_DIRECTEUR_TRAVAUX)).isFalse();
        assertThat(policy.canMutate(CHANTIER, ChantierRoleCodes.BTP_CONDUCTEUR_TRAVAUX)).isFalse();
    }

    @Test
    void chefEquipeCannotAppointAnyone() {
        UserContext.setUserId(USER);
        stubAffectation(ChantierRoleCodes.BTP_CHEF_EQUIPE);

        assertThat(policy.assignableRoles(CHANTIER)).isEmpty();
        assertThat(policy.canMutate(CHANTIER, ChantierRoleCodes.BTP_POINTEUR)).isFalse();
    }

    private void stubAffectation(String roleCode) {
        when(employeRepository.findByTenantIdAndUserId(TENANT, USER))
                .thenReturn(Optional.of(Employe.builder().id(EMPLOYE).build()));
        when(affectationRepository.findActiveForEmployeOnDate(eq(TENANT), eq(EMPLOYE), any(LocalDate.class)))
                .thenReturn(List.of(ChantierAffectation.builder()
                        .id("aff-1")
                        .chantierId(CHANTIER)
                        .employeId(EMPLOYE)
                        .roleCode(roleCode)
                        .isActive(true)
                        .dateDebut(LocalDate.now().minusDays(1))
                        .build()));
    }
}
