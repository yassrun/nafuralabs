package ma.nafura.chantiers.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.time.*;
import java.util.*;
import java.math.BigDecimal;
import com.fasterxml.jackson.databind.ObjectMapper;
import ma.nafura.chantiers.api.dto.BudgetArbreDto;
import ma.nafura.chantiers.domain.activite.*;
import ma.nafura.chantiers.domain.chantier.*;
import ma.nafura.chantiers.repository.*;
import ma.nafura.platform.framework.context.*;
import org.junit.jupiter.api.*;

class PlanningPublicationServiceTest {
    final UUID tenant=UUID.randomUUID();
    final PlanningPublicationRepository publications=mock(PlanningPublicationRepository.class);
    final ActiviteChantierRepository activities=mock(ActiviteChantierRepository.class);
    final ActiviteRattachementRepository attachments=mock(ActiviteRattachementRepository.class);
    final BudgetArbreService budgets=mock(BudgetArbreService.class);
    final ChantierRepository chantiers=mock(ChantierRepository.class);
    final PlanningPolicy policy=mock(PlanningPolicy.class);
    final ObjectMapper json=new ObjectMapper().findAndRegisterModules();
    final PlanningPublicationService service=new PlanningPublicationService(publications,activities,attachments,budgets,chantiers,policy,json);
    final PlanningPublicationService.Options options=new PlanningPublicationService.Options(false,false);
    final List<PlanningPublication> saved=new ArrayList<>();
    ActiviteChantier activity;BudgetArbreDto.NoeudDto sold;
    @BeforeEach void setup(){
        TenantContext.setTenantId(tenant);UserContext.setUserId(UUID.randomUUID());
        when(chantiers.findByIdAndTenantId("c",tenant)).thenReturn(Optional.of(Chantier.builder().id("c").build()));
        activity=ActiviteChantier.builder().id("a").chantierId("c").libelle("Travaux internes").dateDebut(LocalDate.of(2026,9,14)).dateFin(LocalDate.of(2026,9,16)).build();
        when(activities.findByTenantIdAndChantierIdOrderByOrdreAscLibelleAsc(tenant,"c")).thenReturn(List.of(activity));
        sold=BudgetArbreDto.NoeudDto.builder().id("lot").type("LOT").designation("Gros œuvre").nature(NatureLigne.VENDU).totaux(BudgetArbreDto.TotauxDto.builder().margePrevueHt(BigDecimal.valueOf(987654)).avancementPercent(BigDecimal.TEN).build()).build();
        var internal=BudgetArbreDto.NoeudDto.builder().id("secret").designation("Coût confidentiel").nature(NatureLigne.INTERNE).build();
        when(budgets.lireArbre("c")).thenReturn(BudgetArbreDto.builder().code("CH-QA").name("Chantier QA").client("Client").lots(List.of(sold,internal)).build());
        when(attachments.findByTenantIdAndActiviteId(tenant,"a")).thenReturn(List.of(ActiviteRattachement.builder().lotId("lot").build()));
        when(publications.findByTenantIdAndChantierIdOrderByNumeroDesc(tenant,"c")).thenAnswer(i->saved.stream().sorted(Comparator.comparingInt(PlanningPublication::getNumero).reversed()).toList());
        when(publications.saveAndFlush(any())).thenAnswer(i->{PlanningPublication p=i.getArgument(0);if(!saved.contains(p))saved.add(p);p.setVersion(p.getVersion()==null?0:p.getVersion()+1);return p;});
        when(policy.canPublishClient("c")).thenReturn(true);
    }
    @AfterEach void cleanup(){TenantContext.clear();UserContext.clear();}
    PlanningPublicationService.Version publish(){var p=service.preview("c",options);return service.publish("c",new PlanningPublicationService.Publish("Client QA",p.token(),options));}
    @Test void clientSnapshotContainsSoldDatesWithoutInternalAmountsOrPeople() throws Exception {
        var p=service.preview("c",options);assertThat(p.content().rows()).hasSize(1);assertThat(p.content().rows().getFirst().start()).isEqualTo(activity.getDateDebut());
        String encoded=json.writeValueAsString(p.content());assertThat(encoded).doesNotContain("987654","marge","Coût confidentiel","Travaux internes","planningAllocations");
    }
    @Test void publicationIsFrozenAndNumbersIncrease(){
        var first=publish();activity.setDateFin(activity.getDateFin().plusDays(7));var second=publish();
        assertThat(second.numero()).isEqualTo(2);assertThat(service.list("c").getLast().content()).isEqualTo(first.content());
        assertThat(first.content().rows().getFirst().finish()).isNotEqualTo(second.content().rows().getFirst().finish());
    }
    @Test void stalePreviewCannotPublish(){var p=service.preview("c",options);activity.setDateFin(activity.getDateFin().plusDays(1));
        assertThatThrownBy(()->service.publish("c",new PlanningPublicationService.Publish("V1",p.token(),options))).hasMessageContaining("prévision a changé");verify(publications,never()).saveAndFlush(any());}
    @Test void milestoneWithoutSoldLotCanBePublished(){activity.setForme(ActiviteForme.JALON);activity.setNatureCode("JALON_CONTRACTUEL");
        when(attachments.findByTenantIdAndActiviteId(tenant,"a")).thenReturn(List.of());
        var p=service.preview("c",options);assertThat(p.content().rows()).hasSize(2);assertThat(p.content().rows().getFirst().start()).isNull();}
    @Test void proofAppendsWithoutChangingSnapshotAndRejectsStaleVersion(){
        var v=publish();var entity=saved.getFirst();when(publications.findByIdAndTenantIdAndChantierId(v.id(),tenant,"c")).thenReturn(Optional.of(entity));
        var command=new PlanningPublicationService.Acknowledge(v.version(),"ACCORD",LocalDate.now(),"Client QA","PV-QA-1","Test");
        var acknowledged=service.acknowledge("c",v.id(),command);assertThat(acknowledged.content()).isEqualTo(v.content());assertThat(acknowledged.acknowledgements()).hasSize(1);
        assertThatThrownBy(()->service.acknowledge("c",v.id(),command)).hasMessageContaining("historique a changé");
        assertThatThrownBy(()->service.acknowledge("c",v.id(),new PlanningPublicationService.Acknowledge(acknowledged.version(),"REFUS",LocalDate.now(),"Client","",""))).hasMessageContaining("preuve");
    }
    @Test void readAndWriteStayScopedAndRequirePublicationRole(){
        assertThatThrownBy(()->service.list("other")).hasMessageContaining("Chantier introuvable");verify(budgets,never()).lireArbre("other");
        doThrow(new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN)).when(policy).assertCanPublishClient("c");
        assertThatThrownBy(this::publish).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);verify(publications,never()).saveAndFlush(any());
    }
    @Test void returnCannotTargetAnotherChantierOrTenant(){assertThatThrownBy(()->service.acknowledge("c","foreign",new PlanningPublicationService.Acknowledge(0L,"ACCORD",LocalDate.now(),"Client","PV",""))).hasMessageContaining("Version introuvable");}
}
