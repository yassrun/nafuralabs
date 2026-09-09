package ma.nafura.chantiers.service;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.time.LocalDate;
import java.util.*;
import ma.nafura.chantiers.domain.activite.*;
import ma.nafura.chantiers.domain.calendrier.CalendrierOuvreCalculator;
import ma.nafura.chantiers.repository.*;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.*;
import org.springframework.web.server.ResponseStatusException;

class PlanningNetworkServiceTest {
    final UUID tenant=UUID.randomUUID();
    final ActiviteChantierRepository activities=mock(ActiviteChantierRepository.class);
    final ActivitePrecedenceRepository links=mock(ActivitePrecedenceRepository.class);
    final CalendrierChantierService calendars=mock(CalendrierChantierService.class);
    final PlanningPolicy policy=mock(PlanningPolicy.class);
    final PlanningNetworkService service=new PlanningNetworkService(activities,links,calendars,policy);
    ActiviteChantier a,b;
    @BeforeEach void setup() {
        TenantContext.setTenantId(tenant);
        a=task("a");b=task("b");
        when(activities.findByTenantIdAndChantierIdOrderByOrdreAscLibelleAsc(tenant,"c")).thenReturn(List.of(a,b));
        when(links.findByTenantIdAndChantierId(tenant,"c")).thenReturn(List.of(ActivitePrecedence.builder().id("l").predActiviteId("a").succActiviteId("b").typeLien("FD").build()));
        when(calendars.calculatorFor("c")).thenReturn(CalendrierOuvreCalculator.standard("Africa/Casablanca"));
        when(calendars.find("c")).thenReturn(Optional.empty());
        when(activities.findByIdAndTenantId("b",tenant)).thenReturn(Optional.of(b));
    }
    ActiviteChantier task(String id) {return ActiviteChantier.builder().id(id).chantierId("c").libelle(id).forme(ActiviteForme.ACTIVITE).status(ActiviteChantier.STATUS_PLANIFIE).dateDebut(LocalDate.of(2026,9,14)).dateFin(LocalDate.of(2026,9,14)).dureeMinutesOuvrees(480).build();}
    @AfterEach void cleanup(){TenantContext.clear();}
    @Test void simulationDoesNotWriteAndApplicationPersistsProposedDates() {
        var simulation=service.simulate("c");verify(activities,never()).save(any());
        assertThat(b.getDateDebut()).isEqualTo(LocalDate.of(2026,9,14));
        service.apply("c",simulation.token());
        assertThat(b.getDateDebut()).isEqualTo(LocalDate.of(2026,9,15));verify(activities).save(b);
    }
    @Test void changedDurationInvalidatesPreview() {
        var simulation=service.simulate("c");a.setDureeMinutesOuvrees(960);
        assertThatThrownBy(()->service.apply("c",simulation.token())).isInstanceOf(ResponseStatusException.class).hasMessageContaining("planning a changé");
        verify(activities,never()).save(any());
    }
    @Test void keepsStartedDatesAndCalculatesUnstartedSuccessor() {
        a.setStatus("EN_COURS");
        var result=service.simulate("c");
        assertThat(result.rows().getFirst().changed()).isFalse();
        assertThat(result.rows().get(1).start()).isEqualTo(a.getDateFin().plusDays(1));
    }
    @Test void applicationRequiresEditPolicy() {
        doThrow(new IllegalStateException("forbidden")).when(policy).assertCanEditStructure("c");
        assertThatThrownBy(()->service.apply("c","token")).hasMessage("forbidden");
        verify(activities,never()).save(any());
    }
    @Test void runningRemainderNeedsFreshEstimateBeforeAutomaticReschedule() {
        a.setStatus("EN_COURS");a.setDateDebut(LocalDate.now().minusDays(2));a.setDateFin(LocalDate.now().plusDays(1));
        a.setPlanningRemainder(new PlanningRemainder(LocalDate.now().minusDays(1),LocalDate.now(),480,List.of()));
        assertThat(service.simulate("c").rows().getFirst().changed()).isFalse();
    }
}
