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
    final ma.nafura.rh.repository.CongeRepository leaves=mock(ma.nafura.rh.repository.CongeRepository.class);
    final PlanningResourceService service=new PlanningResourceService(activities,assignments,calendars,policy,leaves);
    ActiviteChantier activity;
    ChantierAffectation assignment;
    @BeforeEach void setup() {
        TenantContext.setTenantId(tenant);
        activity=ActiviteChantier.builder().id("a").chantierId("c").forme(ActiviteForme.ACTIVITE).dateDebut(monday).dateFin(monday.plusDays(6)).build();
        assignment=ChantierAffectation.builder().id("r").chantierId("c").employeId("e").dateDebut(monday).build();
        when(activities.findByIdAndTenantId("a",tenant)).thenReturn(Optional.of(activity));
        when(assignments.findByIdAndTenantId("r",tenant)).thenReturn(Optional.of(assignment));
        when(assignments.findByTenantIdAndChantierIdAndIsActiveTrueOrderByRoleCodeAscEmployeIdAsc(tenant,"c")).thenReturn(List.of(assignment));
        when(assignments.findByTenantIdAndEmployeIdInAndIsActiveTrue(eq(tenant),any())).thenReturn(List.of(assignment));
        when(activities.findByTenantIdAndChantierIdInAndDateDebutLessThanEqualAndDateFinGreaterThanEqual(eq(tenant),any(),eq(monday.plusDays(6)),eq(monday))).thenReturn(List.of(activity));
        when(calendars.calculatorFor("c")).thenReturn(CalendrierOuvreCalculator.standard("Africa/Casablanca"));
    }
    @AfterEach void cleanup(){TenantContext.clear();}
    @Test void replaceAndRemoveReservation() {
        service.reserve("c","a","r",480);service.reserve("c","a","r",240);
        assertThat(activity.getPlanningAllocations()).containsExactly(new PlanningAllocation("r",240));
        service.reserve("c","a","r",0);assertThat(activity.getPlanningAllocations()).isEmpty();
    }
    @Test void pausesReleaseReservedCapacityAndResumeUsesSameAllocation() {
        activity.setPlanningAllocations(List.of(new PlanningAllocation("r",240)));
        activity.setPlanningRemainder(new PlanningRemainder(monday,monday.plusDays(4),240,
                List.of(new PlanningRemainder.Pause(monday.plusDays(1),monday.plusDays(3)))));
        var days=service.week("c",monday);
        assertThat(days.getFirst().reservedMinutes()).isEqualTo(240);
        assertThat(days.subList(1,4)).allMatch(d->d.reservedMinutes()==0);
        assertThat(days.get(4).reservedMinutes()).isEqualTo(240);
        assertThat(activity.getPlanningAllocations()).hasSize(1);
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
    @Test void aggregatesOtherChantiersWithoutExposingTheirActivitiesAndFlagsApprovedLeave() {
        activity.setPlanningAllocations(List.of(new PlanningAllocation("r",240)));
        var external=ChantierAffectation.builder().id("outside").chantierId("other").employeId("e").dateDebut(monday).dateFin(monday).build();
        var task=ActiviteChantier.builder().id("secret-activity").chantierId("other").forme(ActiviteForme.ACTIVITE).dateDebut(monday).dateFin(monday.plusDays(1)).planningAllocations(List.of(new PlanningAllocation("outside",360))).build();
        when(assignments.findByTenantIdAndEmployeIdInAndIsActiveTrue(eq(tenant),any())).thenReturn(List.of(assignment,external));
        when(activities.findByTenantIdAndChantierIdInAndDateDebutLessThanEqualAndDateFinGreaterThanEqual(eq(tenant),any(),any(),any())).thenReturn(List.of(activity,task));
        when(calendars.calculatorForResourceAggregation("other")).thenReturn(CalendrierOuvreCalculator.standard("Africa/Casablanca"));
        when(leaves.findByTenantIdAndEmployeIdInAndStatusInAndDateDebutLessThanEqualAndDateFinGreaterThanEqual(eq(tenant),eq(Set.of("e")),eq(Set.of("APPROUVE","EN_COURS","SOLDE")),eq(monday.plusDays(6)),eq(monday)))
                .thenReturn(List.of(ma.nafura.rh.domain.conge.Conge.builder().employeId("e").dateDebut(monday).dateFin(monday).nombreJours(java.math.BigDecimal.ONE).build()));
        var week=service.week("c",monday);
        assertThat(week.getFirst().otherReservedMinutes()).isEqualTo(360);
        assertThat(week.getFirst().overload()).isTrue();
        assertThat(week.getFirst().approvedAbsence()).isTrue();
        assertThat(week.getFirst().activityIds()).containsExactly("a");
        assertThat(week.get(1).otherReservedMinutes()).isZero();
        assertThat(week.get(1).approvedAbsence()).isFalse();
    }
    @Test void halfDayLeaveIsAnAlertNotAConfirmedFullDayConflict() {
        activity.setPlanningAllocations(List.of(new PlanningAllocation("r",240)));
        when(leaves.findByTenantIdAndEmployeIdInAndStatusInAndDateDebutLessThanEqualAndDateFinGreaterThanEqual(eq(tenant),any(),any(),any(),any()))
                .thenReturn(List.of(ma.nafura.rh.domain.conge.Conge.builder().employeId("e").dateDebut(monday).dateFin(monday).nombreJours(new java.math.BigDecimal("0.5")).build()));
        var day=service.week("c",monday).getFirst();assertThat(day.partialAbsence()).isTrue();assertThat(day.approvedAbsence()).isFalse();
    }
    @Test void expiredLocalAssignmentDoesNotExposeOtherChantierLoadsOrLeave() {
        assignment.setDateFin(monday.minusDays(1));
        assertThat(service.week("c",monday)).isEmpty();
        verifyNoInteractions(leaves);
        verify(assignments,never()).findByTenantIdAndEmployeIdInAndIsActiveTrue(any(),any());
    }
    @Test void readPermissionIsCheckedBeforeCrossChantierOrRhQueries() {
        doThrow(new IllegalStateException("forbidden")).when(policy).assertCanRead("c");
        assertThatThrownBy(()->service.week("c",monday)).hasMessage("forbidden");
        verifyNoInteractions(leaves);verify(assignments,never()).findByTenantIdAndEmployeIdInAndIsActiveTrue(any(),any());
    }
}
