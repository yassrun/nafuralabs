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
import ma.nafura.chantiers.api.dto.PlanningCapacitesDto;
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
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** SEKTOR-327 — capacités métier planning, périmètre, ADMIN ≠ signature. */
@ExtendWith(MockitoExtension.class)
class PlanningPolicyTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final UUID USER = UUID.fromString("00000000-0000-4000-8000-0000000000aa");
    private static final String CHANTIER = "ch-1";
    private static final String AUTRE = "ch-other";
    private static final String EMPLOYE = "emp-1";

    @Mock private ChantierAffectationRepository affectationRepository;
    @Mock private EmployeRepository employeRepository;

    private PlanningPolicy policy;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        policy = new PlanningPolicy(new ChantierAffectationPolicy(affectationRepository, employeRepository));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        UserContext.clear();
    }

    @Test
    void chef_litEtPropose_sansAppliquer() {
        UserContext.setUserId(USER);
        stubAffectation(CHANTIER, ChantierRoleCodes.BTP_CHEF_CHANTIER);

        PlanningCapacitesDto c = policy.capacites(CHANTIER);
        assertThat(c.isLire()).isTrue();
        assertThat(c.isProposerStructure()).isTrue();
        assertThat(c.isEditerStructure()).isFalse();
        assertThat(c.isProposerCalendrier()).isTrue();
        assertThat(c.isAdministrerCalendrier()).isFalse();
        assertThat(c.isGererVues()).isTrue();
        policy.assertCanRead(CHANTIER);
        assertThatThrownBy(() -> policy.assertCanEditStructure(CHANTIER)).satisfies(this::forbidden);
        assertThatThrownBy(() -> policy.assertCanAdministerCalendar(CHANTIER)).satisfies(this::forbidden);
    }

    @Test
    void chef_autreChantier_403_sansFuite() {
        UserContext.setUserId(USER);
        stubAffectation(CHANTIER, ChantierRoleCodes.BTP_CHEF_CHANTIER);

        PlanningCapacitesDto c = policy.capacites(AUTRE);
        assertThat(c.isLire()).isFalse();
        assertThat(c.isEditerStructure()).isFalse();
        assertThatThrownBy(() -> policy.assertCanRead(AUTRE)).satisfies(this::forbidden);
        assertThatThrownBy(() -> policy.assertCanEditStructure(AUTRE)).satisfies(this::forbidden);
    }

    @Test
    void conducteur_appliqueStructure_proposeCalendrier() {
        UserContext.setUserId(USER);
        stubAffectation(CHANTIER, ChantierRoleCodes.BTP_CONDUCTEUR_TRAVAUX);

        PlanningCapacitesDto c = policy.capacites(CHANTIER);
        assertThat(c.isLire()).isTrue();
        assertThat(c.isEditerStructure()).isTrue();
        assertThat(c.isProposerStructure()).isFalse();
        assertThat(c.isProposerCalendrier()).isTrue();
        assertThat(c.isAdministrerCalendrier()).isFalse();
        policy.assertCanEditStructure(CHANTIER);
        assertThatThrownBy(() -> policy.assertCanAdministerCalendar(CHANTIER)).satisfies(this::forbidden);
    }

    @Test
    void dtEtDg_appliquentDansLePerimetre() {
        UserContext.setUserId(USER);
        stubAffectation(CHANTIER, ChantierRoleCodes.BTP_DIRECTEUR_TRAVAUX);
        PlanningCapacitesDto dt = policy.capacites(CHANTIER);
        assertThat(dt.isEditerStructure()).isTrue();
        assertThat(dt.isAdministrerCalendrier()).isTrue();
        assertThat(dt.isProposerCalendrier()).isFalse();
        policy.assertCanAdministerCalendar(CHANTIER);

        UserContext.clear();
        UserContext.setUserRole(ChantierRoleCodes.BTP_DG);
        PlanningCapacitesDto dg = policy.capacites(AUTRE);
        assertThat(dg.isLire()).isTrue();
        assertThat(dg.isEditerStructure()).isTrue();
        assertThat(dg.isAdministrerCalendrier()).isTrue();
    }

    @Test
    void adminTechnique_nEstPasUneSignatureMetier() {
        UserContext.setUserId(USER);
        UserContext.setUserRole("ADMIN");
        when(employeRepository.findByTenantIdAndUserId(TENANT, USER)).thenReturn(Optional.empty());

        PlanningCapacitesDto c = policy.capacites(CHANTIER);
        assertThat(c.isLire()).isFalse();
        assertThat(c.isEditerStructure()).isFalse();
        assertThat(c.isAdministrerCalendrier()).isFalse();
        assertThatThrownBy(() -> policy.assertCanRead(CHANTIER)).satisfies(this::forbidden);
        assertThatThrownBy(() -> policy.assertCanEditStructure(CHANTIER)).satisfies(this::forbidden);
        assertThatThrownBy(() -> policy.assertCanAdministerCalendar(CHANTIER)).satisfies(this::forbidden);
    }

    @Test
    void owner_appliquePartout() {
        UserContext.setUserRole("OWNER");
        PlanningCapacitesDto c = policy.capacites(CHANTIER);
        assertThat(c.isLire()).isTrue();
        assertThat(c.isEditerStructure()).isTrue();
        assertThat(c.isAdministrerCalendrier()).isTrue();
        assertThat(c.isGererVues()).isTrue();
        assertThat(c.isProposerStructure()).isFalse();
        policy.assertCanRead(CHANTIER);
        policy.assertCanEditStructure(CHANTIER);
        policy.assertCanAdministerCalendar(CHANTIER);
    }

    @Test
    void daf_lectureSeule() {
        UserContext.setUserRole(ChantierRoleCodes.BTP_DAF);
        PlanningCapacitesDto c = policy.capacites(CHANTIER);
        assertThat(c.isLire()).isTrue();
        assertThat(c.isGererVues()).isTrue();
        assertThat(c.isEditerStructure()).isFalse();
        assertThat(c.isAdministrerCalendrier()).isFalse();
        policy.assertCanRead(CHANTIER);
        assertThatThrownBy(() -> policy.assertCanEditStructure(CHANTIER)).satisfies(this::forbidden);
    }

    @Test
    void magasinier_litSansProposerLaStructure() {
        UserContext.setUserId(USER);
        stubAffectation(CHANTIER, ChantierRoleCodes.BTP_MAGASINIER);

        PlanningCapacitesDto c = policy.capacites(CHANTIER);
        assertThat(c.isLire()).isTrue();
        assertThat(c.isGererVues()).isTrue();
        assertThat(c.isProposerStructure()).isFalse();
        assertThat(c.isEditerStructure()).isFalse();
        assertThat(c.isProposerCalendrier()).isFalse();
        assertThat(c.isAdministrerCalendrier()).isFalse();
    }

    @Test
    void a01a03_absentsDuPayloadL1() {
        PlanningCapacitesDto c = PlanningCapacitesDto.applyAll();
        assertThat(c).hasNoNullFieldsOrProperties();
        /* semaine / report / publication : pas de champs sur le DTO L1 */
    }

    @Test
    void fromGradeAndRoles_ingenieurProposeCommeChef() {
        PlanningCapacitesDto c = PlanningPolicy.fromGradeAndRoles(
                ChantierRoleCodes.COMMAND_GRADE_SITE,
                List.of(ChantierRoleCodes.BTP_INGENIEUR),
                ChantierRoleCodes.BTP_INGENIEUR);
        assertThat(c.isProposerStructure()).isTrue();
        assertThat(c.isEditerStructure()).isFalse();
        assertThat(c.isProposerCalendrier()).isTrue();
    }

    private void forbidden(Throwable ex) {
        assertThat(ex).isInstanceOf(ResponseStatusException.class);
        ResponseStatusException rse = (ResponseStatusException) ex;
        assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(rse.getReason()).isEqualTo(PlanningPolicy.REFUS_CODE);
    }

    private void stubAffectation(String chantierId, String roleCode) {
        when(employeRepository.findByTenantIdAndUserId(TENANT, USER))
                .thenReturn(Optional.of(Employe.builder().id(EMPLOYE).build()));
        when(affectationRepository.findActiveForEmployeOnDate(eq(TENANT), eq(EMPLOYE), any(LocalDate.class)))
                .thenReturn(List.of(ChantierAffectation.builder()
                        .id("aff-1")
                        .chantierId(chantierId)
                        .employeId(EMPLOYE)
                        .roleCode(roleCode)
                        .isActive(true)
                        .dateDebut(LocalDate.now().minusDays(1))
                        .build()));
    }
}
