package ma.nafura.chantiers.domain.activite;
import static org.assertj.core.api.Assertions.*;
import java.time.LocalDate;
import java.util.List;
import ma.nafura.chantiers.domain.calendrier.CalendrierOuvreCalculator;
import org.junit.jupiter.api.Test;
class PlanningNetworkTest {
    private PlanningNetwork.Task task(String id,int minutes) {return new PlanningNetwork.Task(id,id,LocalDate.of(2026,9,14),minutes,minutes==0,CalendrierOuvreCalculator.standard("Africa/Casablanca"));}
    @Test void chainFdAndMilestone() {
        var result=PlanningNetwork.calculate(List.of(task("A",480),task("B",480),task("M",0)),List.of(new PlanningNetwork.Link("A","B","FD"),new PlanningNetwork.Link("B","M","FD")));
        assertThat(result.rows().get(1).start()).isEqualTo(LocalDate.of(2026,9,15));
        assertThat(result.rows().get(2).start()).isEqualTo(LocalDate.of(2026,9,16));
        assertThat(result.rows()).allMatch(PlanningNetwork.Row::critical);
    }
    @Test void independentShortBranchHasFloat() {
        var result=PlanningNetwork.calculate(List.of(task("A",1440),task("B",480)),List.of());
        assertThat(result.rows().get(0).critical()).isTrue();
        assertThat(result.rows().get(1).floatDays()).isEqualTo(2);
    }
    @Test void allFourTypesHonorBounds() {
        for(String type:List.of("FD","DD","FF","DF")) {
            var result=PlanningNetwork.calculate(List.of(task("A",1440),task("B",480)),List.of(new PlanningNetwork.Link("A","B",type)));
            var b=result.rows().get(1);
            assertThat(b.start()).isEqualTo(LocalDate.of(2026,9,type.equals("FD")?17:type.equals("FF")?16:14));
        }
    }
    @Test void weekendIsSkipped() {
        var result=PlanningNetwork.calculate(List.of(task("A",2400),task("B",480)),List.of(new PlanningNetwork.Link("A","B","FD")));
        assertThat(result.rows().get(1).start()).isEqualTo(LocalDate.of(2026,9,21));
    }
    @Test void cyclesRejected() {
        assertThatThrownBy(()->PlanningNetwork.calculate(List.of(task("A",480),task("B",480)),List.of(new PlanningNetwork.Link("A","B","FD"),new PlanningNetwork.Link("B","A","FD"))))
            .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Cycle");
    }
    @Test void missingEndpointRejected() {
        assertThatThrownBy(()->PlanningNetwork.calculate(List.of(task("A",480)),List.of(new PlanningNetwork.Link("A","phase","FD"))))
            .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("phases");
    }
}
