package ma.nafura.chantiers.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.time.LocalDate;
import java.util.*;
import ma.nafura.chantiers.domain.activite.*;
import ma.nafura.chantiers.domain.chantier.ChantierAffectation;
import ma.nafura.chantiers.domain.calendrier.CalendrierOuvreCalculator;
import ma.nafura.chantiers.repository.*;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.*;

class PlanningResourceServiceTest {
    final UUID tenant=UUID.randomUUID();
    final LocalDate monday=LocalDate.of(2026,9,14);
    final ActiviteChantierRepository activities=mock(ActiviteChantierRepository.class);
    final ChantierAffectationRepository assignments=mock(ChantierAffectationRepository.class);
    final CalendrierChantierService calendars=mock(CalendrierChantierService.class);
    final PlanningPolicy policy=mock(PlanningPolicy.class);
    final PlanningResourceService service=new PlanningResourceService(activities,assignments,calendars,policy);
    ActiviteChantier activity;
    ChantierAffectation assignment;
    @BeforeEach void setup() {
        TenantContext.setTenantId(tenant);
        activity=ActiviteChantier.builder().id("a").chantierId("c").forme(ActiviteForme.ACTIVITE).dateDebut(monday).dateFin(monday.plusDays(6)).build();
        assignment=ChantierAffectation.builder().id("r").chantierId("c").employeId("e").dateDebut(monday).build();
        when(activities.findByIdAndTenantId("a",tenant)).thenReturn(Optional.of(activity));
        when(assignments.findByIdAndTenantId("r",tenant)).thenReturn(Optional.of(assignment));
    }
    @AfterEach void cleanup(){TenantContext.clear();}
    @Test void replaceAndRemoveReservation() {
        service.reserve("c","a","r",480);service.reserve("c","a","r",240);
        assertThat(activity.getPlanningAllocations()).containsExactly(new PlanningAllocation("r",240));
        service.reserve("c","a","r",0);assertThat(activity.getPlanningAllocations()).isEmpty();
    }
    @Test void rejectsPartialAssignment() {
        assignment.setDateFin(monday.plusDays(2));
        assertThatThrownBy(()->service.reserve("c","a","r",480)).hasMessageContaining("toute la période");
        verify(activities,never()).save(any());
    }
    @Test void rejectsCrossChantierAndInvalidDuration() {
        assertThatThrownBy(()->service.reserve("other","a","r",480)).hasMessageContaining("hors chantier");
        assertThatThrownBy(()->service.reserve("c","a","r",1441)).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void enforcesPolicyBeforeMutation() {
        doThrow(new IllegalStateException("forbidden")).when(policy).assertCanEditStructure("c");
        assertThatThrownBy(()->service.reserve("c","a","r",480)).hasMessage("forbidden");
        verify(activities,never()).save(any());
    }
    @Test void sumsDailyReservationsAndSkipsWeekend() {
        activity.setPlanningAllocations(List.of(new PlanningAllocation("r",600)));
        when(assignments.findByTenantIdAndChantierIdAndIsActiveTrueOrderByRoleCodeAscEmployeIdAsc(tenant,"c")).thenReturn(List.of(assignment));
        when(activities.findByTenantIdAndChantierIdOrderByOrdreAscLibelleAsc(tenant,"c")).thenReturn(List.of(activity));
        when(calendars.calculatorFor("c")).thenReturn(CalendrierOuvreCalculator.standard("Africa/Casablanca"));
        var week=service.week("c",monday);
        assertThat(week).hasSize(7);
        assertThat(week.getFirst().reservedMinutes()).isEqualTo(600);
        assertThat(week.getFirst().overload()).isTrue();
        assertThat(week.get(5).reservedMinutes()).isZero();
    }
}
