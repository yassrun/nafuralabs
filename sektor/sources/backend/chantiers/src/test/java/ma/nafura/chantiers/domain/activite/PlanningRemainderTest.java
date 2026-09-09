package ma.nafura.chantiers.domain.activite;
import static org.assertj.core.api.Assertions.*;
import java.time.LocalDate;
import java.util.*;
import ma.nafura.chantiers.domain.calendrier.CalendrierOuvreCalculator;
import org.junit.jupiter.api.Test;
class PlanningRemainderTest {
    final LocalDate monday=LocalDate.of(2026,9,7);
    final CalendrierOuvreCalculator calendar=CalendrierOuvreCalculator.standard("Africa/Casablanca");
    PlanningNetwork.Task rest(){return new PlanningNetwork.Task("a","Reprise",monday.plusWeeks(1),960,false,calendar,monday,null);}
    @Test void remainingFinishDrivesFdButDdUsesPreservedStart(){
        var b=new PlanningNetwork.Task("b","Suite",monday,480,false,calendar);
        var c=new PlanningNetwork.Task("c","Parallèle",monday,480,false,calendar);
        var result=PlanningNetwork.calculate(List.of(rest(),b,c),List.of(new PlanningNetwork.Link("a","b","FD"),new PlanningNetwork.Link("a","c","DD")));
        assertThat(result.rows().getFirst().start()).isEqualTo(monday);
        assertThat(result.rows().getFirst().workStart()).isEqualTo(monday.plusWeeks(1));
        assertThat(result.rows().getFirst().finish()).isEqualTo(monday.plusDays(8));
        assertThat(result.rows().get(1).start()).isEqualTo(monday.plusDays(9));
        assertThat(result.rows().get(2).start()).isEqualTo(monday);
    }
    @Test void finishedDatesAreAnchorsAndNeverCritical(){
        var fixed=new PlanningNetwork.Task("done","Terminé",monday.minusDays(1),0,false,calendar,monday.minusDays(1),monday);
        var result=PlanningNetwork.calculate(List.of(fixed,rest()),List.of(new PlanningNetwork.Link("done","a","FF")));
        assertThat(result.rows().getFirst().start()).isEqualTo(monday.minusDays(1));assertThat(result.rows().getFirst().finish()).isEqualTo(monday);assertThat(result.rows().getFirst().critical()).isFalse();
    }
    @Test void refusesToMoveStartOfRunningSuccessor(){
        var fixed=new PlanningNetwork.Task("b","Déjà commencé",monday.plusDays(1),0,false,calendar,monday.plusDays(1),monday.plusDays(2));
        assertThatThrownBy(()->PlanningNetwork.calculate(List.of(rest(),fixed),List.of(new PlanningNetwork.Link("a","b","FD")))).hasMessageContaining("début déjà constaté");
    }
    @Test void finishConstraintCanPostponeRemainingWork(){
        var fixed=new PlanningNetwork.Task("b","Référence",monday,0,false,calendar,monday,monday.plusDays(11));
        var result=PlanningNetwork.calculate(List.of(fixed,rest()),List.of(new PlanningNetwork.Link("b","a","FF")));
        assertThat(result.rows().get(1).start()).isEqualTo(monday);assertThat(result.rows().get(1).finish()).isEqualTo(monday.plusDays(11));
    }
    @Test void repeatedPausesPreserveHistoryWithoutDuplicatingResources(){
        var a=ActiviteChantier.builder().dateDebut(monday).dateFin(monday.plusDays(4)).build();
        a.setPlanningRemainder(PlanningRemainder.report(a,monday.plusDays(2),monday.plusWeeks(1),960));a.setDateFin(monday.plusDays(8));
        a.setPlanningRemainder(PlanningRemainder.report(a,monday.plusDays(7),monday.plusWeeks(2),480));a.setDateFin(monday.plusWeeks(2));
        assertThat(a.plannedOn(monday)).isTrue();assertThat(a.plannedOn(monday.plusDays(3))).isFalse();assertThat(a.plannedOn(monday.plusDays(7))).isTrue();assertThat(a.plannedOn(monday.plusDays(8))).isFalse();assertThat(a.plannedOn(monday.plusWeeks(2))).isTrue();
    }
}
