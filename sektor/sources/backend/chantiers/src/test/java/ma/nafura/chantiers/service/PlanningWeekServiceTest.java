package ma.nafura.chantiers.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.time.*;
import java.util.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import ma.nafura.chantiers.domain.activite.*;
import ma.nafura.chantiers.repository.*;
import ma.nafura.platform.framework.context.*;
import org.junit.jupiter.api.*;

class PlanningWeekServiceTest {
    final UUID tenant=UUID.randomUUID(),chef=UUID.randomUUID(),conducteur=UUID.randomUUID();
    final LocalDate monday=LocalDate.of(2026,9,14);
    final PlanningWeekRepository weeks=mock(PlanningWeekRepository.class);
    final ActiviteChantierRepository activities=mock(ActiviteChantierRepository.class);
    final ChantierAffectationRepository assignments=mock(ChantierAffectationRepository.class);
    final CalendrierChantierService calendars=mock(CalendrierChantierService.class);
    final PlanningPolicy policy=mock(PlanningPolicy.class);
    final ChantierRepository chantiers=mock(ChantierRepository.class);
    final PlanningResourceService resources=mock(PlanningResourceService.class);
    final PlanningWeekService service=new PlanningWeekService(weeks,activities,assignments,calendars,policy,new ObjectMapper().findAndRegisterModules(),chantiers,resources);
    PlanningWeek saved;ActiviteChantier activity;
    @BeforeEach void setup(){
        TenantContext.setTenantId(tenant);UserContext.setUserId(chef);
        when(chantiers.findByIdAndTenantId("c",tenant)).thenReturn(Optional.of(ma.nafura.chantiers.domain.chantier.Chantier.builder().id("c").tenantId(tenant).build()));
        activity=ActiviteChantier.builder().id("a").chantierId("c").libelle("Terrassement").dateDebut(monday).dateFin(monday.plusDays(2)).dureeMinutesOuvrees(1440).build();
        when(activities.findByTenantIdAndChantierIdOrderByOrdreAscLibelleAsc(tenant,"c")).thenReturn(List.of(activity));
        when(weeks.findByTenantIdAndChantierIdAndWeekStart(tenant,"c",monday)).thenAnswer(i->Optional.ofNullable(saved));
        when(weeks.saveAndFlush(any())).thenAnswer(i->{saved=i.getArgument(0);saved.setVersion(saved.getVersion()==null?0:saved.getVersion()+1);return saved;});
        when(calendars.find("c")).thenReturn(Optional.empty());
        when(policy.canPrepareWeek("c")).thenReturn(true);when(policy.canValidateWeek("c")).thenReturn(true);
    }
    @AfterEach void cleanup(){TenantContext.clear();UserContext.clear();}
    PlanningWeekService.View act(String action){var v=service.read("c",monday);return service.command("c",monday,action,new PlanningWeekService.Command(v.version(),v.token(),"Préparation"));}
    @Test void anotherPersonApprovesAndHistoryRemains(){
        act("SAVE");act("SUBMIT");UserContext.setUserId(conducteur);
        var validated=act("APPROVE");assertThat(validated.status()).isEqualTo("VALIDEE");assertThat(validated.history()).hasSize(3);
        UserContext.setUserId(chef);act("REVISE");assertThat(saved.getRevision()).isEqualTo(2);assertThat(saved.getHistory().get(2).action()).isEqualTo("APPROVE");
    }
    @Test void authorCannotApproveEvenAfterAnotherPersonRevises(){
        act("SAVE");act("SUBMIT");assertThatThrownBy(()->act("APPROVE")).hasMessageContaining("autre personne");
        UserContext.setUserId(conducteur);act("REVISE");act("SUBMIT");
        UserContext.setUserId(chef);assertThatThrownBy(()->act("APPROVE")).hasMessageContaining("autre personne");
    }
    @Test void movedActivityInvalidatesApprovalWithoutErasingHistory(){
        act("SAVE");act("SUBMIT");UserContext.setUserId(conducteur);act("APPROVE");
        activity.setDateFin(monday.plusDays(3));var v=service.read("c",monday);
        assertThat(v.status()).isEqualTo("A_REVALIDER");assertThat(v.submitted().activities().getFirst().finish()).isEqualTo(monday.plusDays(2));
        assertThat(v.current().activities().getFirst().finish()).isEqualTo(monday.plusDays(3));
    }
    @Test void approvedLeaveInvalidatesWeekAndPreventsApprovalAfterResubmission(){
        act("SAVE");act("SUBMIT");UserContext.setUserId(conducteur);act("APPROVE");
        when(resources.week("c",monday)).thenReturn(List.of(new PlanningResourceService.Day("e",monday,480,480,false,List.of("a"),0,true,false)));
        assertThat(service.read("c",monday).status()).isEqualTo("A_REVALIDER");
        UserContext.setUserId(chef);act("REVISE");act("SUBMIT");UserContext.setUserId(conducteur);
        assertThatThrownBy(()->act("APPROVE")).hasMessageContaining("congé approuvé");
    }
    @Test void submittedChangesCannotBeApprovedAndStaleVersionIsRejected(){
        act("SAVE");var before=service.read("c",monday);act("SUBMIT");
        assertThatThrownBy(()->service.command("c",monday,"REVISE",new PlanningWeekService.Command(before.version(),before.token(),"x"))).hasMessageContaining("semaine a changé");
        activity.setDateFin(monday.plusDays(3));UserContext.setUserId(conducteur);
        assertThatThrownBy(()->act("APPROVE")).hasMessageContaining("nouvelle révision");
    }
    @Test void changedNeedsInvalidateSubmittedContent(){
        act("SAVE");act("SUBMIT");activity.setPlanningNeeds(List.of(new PlanningNeed("n","MATIERE","Béton",java.math.BigDecimal.ONE,"m3",0,3,null,null,null)));
        assertThat(service.read("c",monday).status()).isEqualTo("A_RESOUMETTRE");
    }
    @Test void rejectRequiresReasonAndNewRevisionBeforeResubmission(){
        act("SAVE");act("SUBMIT");UserContext.setUserId(conducteur);var v=service.read("c",monday);
        assertThatThrownBy(()->service.command("c",monday,"REJECT",new PlanningWeekService.Command(v.version(),v.token(),""))).hasMessageContaining("corrections");
        assertThat(act("REJECT").status()).isEqualTo("A_CORRIGER");
        assertThatThrownBy(()->act("SUBMIT")).hasMessageContaining("incompatible");
    }
    @Test void realProgressDoesNotRewriteOrInvalidateForecast(){
        act("SAVE");act("SUBMIT");UserContext.setUserId(conducteur);act("APPROVE");
        activity.setAvancementPercent(java.math.BigDecimal.TEN);activity.setStatus("EN_COURS");
        assertThat(service.read("c",monday).status()).isEqualTo("VALIDEE");
    }
    @Test void weekMustStartOnMondayAndCannotSubmitEmptyWeek(){
        assertThatThrownBy(()->service.read("c",monday.plusDays(1))).hasMessageContaining("lundi");
        when(activities.findByTenantIdAndChantierIdOrderByOrdreAscLibelleAsc(tenant,"c")).thenReturn(List.of());
        act("SAVE");assertThatThrownBy(()->act("SUBMIT")).hasMessageContaining("Aucune activité");
    }
    @Test void policyDenialPreventsWrite(){
        doThrow(new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN)).when(policy).assertCanPrepareWeek("c");
        assertThatThrownBy(()->act("SAVE")).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);verify(weeks,never()).saveAndFlush(any());
    }
    @Test void unavailableAssignmentBlocksApprovalButNotDraft(){
        var calculator=mock(ma.nafura.chantiers.domain.calendrier.CalendrierOuvreCalculator.class);
        when(calculator.minutesOuvrees(any())).thenReturn(480L);when(calendars.calculatorFor("c")).thenReturn(calculator);
        activity.setPlanningAllocations(List.of(new PlanningAllocation("missing",480)));
        assertThat(act("SAVE").current().conflicts()).isNotEmpty();act("SUBMIT");UserContext.setUserId(conducteur);
        assertThatThrownBy(()->act("APPROVE")).hasMessageContaining("affectations indisponibles");
    }
    @Test void foreignTenantCannotReadOrWriteWeek(){
        act("SAVE");TenantContext.setTenantId(UUID.randomUUID());
        assertThatThrownBy(()->service.read("c",monday)).hasMessageContaining("introuvable");
        assertThatThrownBy(()->service.command("c",monday,"SAVE",new PlanningWeekService.Command(null,"x","x"))).hasMessageContaining("introuvable");
        verify(weeks,times(1)).saveAndFlush(any());
    }
    @Test void historyTimestampRoundTripDoesNotMakeEntityDirty() throws Exception {
        var mapper=new ObjectMapper().findAndRegisterModules();
        var event=new PlanningWeek.Event(1,"SAVE",chef.toString(),Instant.parse("2026-09-09T17:00:00.123456789Z"),"Test","{}");
        var copy=mapper.readValue(mapper.writeValueAsString(event),PlanningWeek.Event.class);
        assertThat(copy).isEqualTo(event);
    }
}
