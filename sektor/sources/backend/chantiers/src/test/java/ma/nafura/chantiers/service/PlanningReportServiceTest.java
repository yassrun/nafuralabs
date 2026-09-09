package ma.nafura.chantiers.service;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.time.*;
import java.util.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import ma.nafura.chantiers.domain.activite.*;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.chantiers.domain.calendrier.CalendrierOuvreCalculator;
import ma.nafura.chantiers.repository.*;
import ma.nafura.platform.framework.context.*;
import org.junit.jupiter.api.*;

class PlanningReportServiceTest {
    final UUID tenant=UUID.randomUUID(),chef=UUID.randomUUID(),conducteur=UUID.randomUUID();
    final LocalDate monday=LocalDate.of(2026,9,14);
    final PlanningReportRepository reports=mock(PlanningReportRepository.class);
    final ActiviteChantierRepository activities=mock(ActiviteChantierRepository.class);
    final ActivitePrecedenceRepository edges=mock(ActivitePrecedenceRepository.class);
    final ChantierRepository chantiers=mock(ChantierRepository.class);
    final CalendrierChantierService calendars=mock(CalendrierChantierService.class);
    final PlanningWeekService weeks=mock(PlanningWeekService.class);
    final PlanningPolicy policy=mock(PlanningPolicy.class);
    final PlanningNetworkService network=new PlanningNetworkService(activities,edges,calendars,policy);
    final PlanningReportService service=new PlanningReportService(reports,activities,chantiers,network,weeks,policy,new ObjectMapper().findAndRegisterModules());
    final PlanningReportService.Request request=new PlanningReportService.Request(monday,monday.plusWeeks(1),List.of("a"));
    PlanningReport saved;ActiviteChantier first,second;
    @BeforeEach void setup(){
        TenantContext.setTenantId(tenant);UserContext.setUserId(chef);
        when(chantiers.findByIdAndTenantId("c",tenant)).thenReturn(Optional.of(Chantier.builder().id("c").build()));
        first=activity("a",monday,2400,monday.plusDays(4));second=activity("b",monday.plusWeeks(1),480,monday.plusWeeks(1));
        when(activities.findByTenantIdAndChantierIdOrderByOrdreAscLibelleAsc(tenant,"c")).thenReturn(List.of(first,second));
        when(activities.findByIdAndTenantId("a",tenant)).thenReturn(Optional.of(first));when(activities.findByIdAndTenantId("b",tenant)).thenReturn(Optional.of(second));
        when(edges.findByTenantIdAndChantierId(tenant,"c")).thenReturn(List.of(ActivitePrecedence.builder().id("link").predActiviteId("a").succActiviteId("b").typeLien("FD").build()));
        when(calendars.calculatorFor("c")).thenReturn(CalendrierOuvreCalculator.standard("Africa/Casablanca"));when(calendars.find("c")).thenReturn(Optional.empty());
        when(weeks.read(eq("c"),any())).thenAnswer(i->new PlanningWeekService.View(1L,1,"VALIDEE","",false,"week-token",null,null,List.of(),true,true,false));
        when(reports.saveAndFlush(any())).thenAnswer(i->{saved=i.getArgument(0);saved.setVersion(saved.getVersion()==null?0:saved.getVersion()+1);return saved;});
        when(reports.findByIdAndTenantIdAndChantierId(anyString(),eq(tenant),eq("c"))).thenAnswer(i->Optional.ofNullable(saved));
        when(policy.canPrepareWeek("c")).thenReturn(true);when(policy.canValidateWeek("c")).thenReturn(true);
    }
    @AfterEach void cleanup(){TenantContext.clear();UserContext.clear();}
    ActiviteChantier activity(String id,LocalDate start,int minutes,LocalDate finish){return ActiviteChantier.builder().id(id).tenantId(tenant).chantierId("c").libelle(id).status("PLANIFIE").dateDebut(start).dateFin(finish).dureeMinutesOuvrees(minutes).build();}
    PlanningReportService.View propose(){var p=service.preview("c",request);return service.propose("c",new PlanningReportService.Propose(request,p.token(),"Report QA"));}
    @Test void previewPropagatesSuccessorSkipsWeekendAndDoesNotMutate(){var p=service.preview("c",request);
        assertThat(p.changes()).hasSize(2);assertThat(p.changes().get(1).start()).isEqualTo(monday.plusWeeks(2));assertThat(p.weeks()).hasSize(3);
        assertThat(first.getDateDebut()).isEqualTo(monday);verify(activities,never()).save(any());verify(weeks,never()).command(any(),any(),any(),any());}
    @Test void separateApproverAppliesAllDatesAndKeepsRecordedImpact(){var proposed=propose();String snapshot=saved.getPreview();UserContext.setUserId(conducteur);
        var applied=service.decide("c",proposed.id(),new PlanningReportService.Decide(proposed.version(),"APPROVE","Validé QA"));
        assertThat(applied.status()).isEqualTo("APPLIQUE");assertThat(first.getDateDebut()).isEqualTo(monday.plusWeeks(1));assertThat(second.getDateDebut()).isEqualTo(monday.plusWeeks(2));assertThat(saved.getPreview()).isEqualTo(snapshot);
        verify(weeks,never()).command(any(),any(),any(),any());}
    @Test void ownProposalCannotBeApprovedButCanBeWithdrawn(){var proposed=propose();
        assertThatThrownBy(()->service.decide("c",proposed.id(),new PlanningReportService.Decide(proposed.version(),"APPROVE","Oui"))).hasMessageContaining("autre personne");
        assertThat(service.decide("c",proposed.id(),new PlanningReportService.Decide(proposed.version(),"CANCEL","À revoir")).status()).isEqualTo("ANNULE");verify(activities,never()).save(any());}
    @Test void changedActivityOrWeekMakesProposalStale(){var proposed=propose();second.setLibelle("Nouveau contenu");UserContext.setUserId(conducteur);
        assertThatThrownBy(()->service.decide("c",proposed.id(),new PlanningReportService.Decide(proposed.version(),"APPROVE","Oui"))).hasMessageContaining("impact du report a changé");verify(activities,never()).save(any());}
    @Test void newlyValidatedWeekRequiresFreshPreview(){var p=service.preview("c",request);
        when(weeks.read(eq("c"),any())).thenReturn(new PlanningWeekService.View(2L,2,"VALIDEE","",false,"new-token",null,null,List.of(),true,true,false));
        assertThatThrownBy(()->service.propose("c",new PlanningReportService.Propose(request,p.token(),"Report"))).hasMessageContaining("semaines ont changé");}
    @Test void startedActivityAndWrongWeekCannotBeMoved(){first.setAvancementPercent(java.math.BigDecimal.TEN);
        assertThatThrownBy(()->service.preview("c",request)).hasMessageContaining("non commencées");first.setAvancementPercent(null);
        assertThatThrownBy(()->service.preview("c",new PlanningReportService.Request(monday.plusWeeks(1),monday.plusWeeks(2),List.of("a")))).hasMessageContaining("semaine de départ");}
    @Test void roleAndTenantScopeCheckedBeforeWrite(){doThrow(new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN)).when(policy).assertCanPrepareWeek("c");
        assertThatThrownBy(this::propose).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);verify(reports,never()).saveAndFlush(any());
        assertThatThrownBy(()->service.preview("other",request)).hasMessageContaining("Chantier introuvable");}
    @Test void needDatesAreShownButPurchaseDatesNeverChanged(){first.setPlanningNeeds(List.of(new PlanningNeed("n","MATIERE","Béton",java.math.BigDecimal.ONE,"m3",2,5,"da","DA-QA",monday.minusDays(2))));
        var p=service.preview("c",request);assertThat(p.checks()).anyMatch(s->s.contains("2026-09-19")&&s.contains("2026-09-14")&&s.contains("conserve sa date"));assertThat(first.getPlanningNeeds().getFirst().requestedDate()).isEqualTo(monday.minusDays(2));}
    @Test void approvedRemainderKeepsIdentityProgressAndNeeds(){
        LocalDate today=LocalDate.now(),source=today.with(java.time.temporal.TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        first.setDateDebut(source);first.setDateFin(source.plusDays(4));first.setStatus("EN_COURS");first.setAvancementPercent(java.math.BigDecimal.valueOf(40));
        first.setPlanningNeeds(List.of(new PlanningNeed("n","MATIERE","Béton",java.math.BigDecimal.TEN,"m3",2,5,"da","DA-QA",source.minusDays(2))));
        var needs=first.getPlanningNeeds();var r=new PlanningReportService.Request(source,source.plusWeeks(1),List.of("a"),Map.of("a",new PlanningReportService.Remaining(today,960)));
        var p=service.preview("c",r);assertThat(p.changes().getFirst().start()).isEqualTo(source);
        var proposed=service.propose("c",new PlanningReportService.Propose(r,p.token(),"Reste à faire"));UserContext.setUserId(conducteur);
        service.decide("c",proposed.id(),new PlanningReportService.Decide(proposed.version(),"APPROVE","Validé"));
        assertThat(first.getId()).isEqualTo("a");assertThat(first.getDateDebut()).isEqualTo(source);assertThat(first.getAvancementPercent()).isEqualByComparingTo("40");assertThat(first.getPlanningNeeds()).isSameAs(needs);
        assertThat(first.getPlanningRemainder().minutes()).isEqualTo(960);assertThat(first.plannedOn(source.plusWeeks(1))).isTrue();
        if(today.isBefore(source.plusDays(6)))assertThat(first.plannedOn(today.plusDays(1))).isFalse();
    }
}
