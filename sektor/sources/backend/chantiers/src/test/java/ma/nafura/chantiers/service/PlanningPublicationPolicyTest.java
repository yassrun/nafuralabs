package ma.nafura.chantiers.service;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import org.junit.jupiter.api.Test;
class PlanningPublicationPolicyTest {
    @Test void publicationRequiresDirectorGradeOnThisChantier(){
        var assignments=mock(ChantierAffectationPolicy.class);var policy=new PlanningPolicy(assignments);
        for(int grade=-1;grade<=4;grade++){
            when(assignments.actorGradeOn("c")).thenReturn(grade);
            assertThat(policy.canPublishClient("c")).isEqualTo(grade>=3);
            if(grade<3)assertThatThrownBy(()->policy.assertCanPublishClient("c")).hasMessageContaining(PlanningPolicy.REFUS_CODE);
            else policy.assertCanPublishClient("c");
        }
        when(assignments.actorGradeOn("other")).thenReturn(-1);
        assertThat(policy.canPublishClient("other")).isFalse();
    }
}
