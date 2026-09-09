package ma.nafura.chantiers.service;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import ma.nafura.chantiers.domain.activite.*;
import ma.nafura.chantiers.repository.ActiviteChantierRepository;
import ma.nafura.achats.service.DemandeAchatService;
import ma.nafura.achats.domain.demande.DemandeAchat;
import ma.nafura.achats.api.request.DemandeAchatCreateDto;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.*;
import org.mockito.ArgumentCaptor;

class PlanningNeedServiceTest {
    final UUID tenant=UUID.randomUUID();
    final ActiviteChantierRepository repo=mock(ActiviteChantierRepository.class);
    final PlanningPolicy policy=mock(PlanningPolicy.class);
    final DemandeAchatService purchases=mock(DemandeAchatService.class);
    final ma.nafura.chantiers.repository.ChantierRepository chantiers=mock(ma.nafura.chantiers.repository.ChantierRepository.class);
    final PlanningNeedService service=new PlanningNeedService(repo,policy,purchases,chantiers);
    ActiviteChantier activity;
    @BeforeEach void setup(){TenantContext.setTenantId(tenant);activity=ActiviteChantier.builder().id("a").chantierId("c").libelle("Coulage").forme(ActiviteForme.ACTIVITE).dateDebut(LocalDate.of(2026,10,20)).build();when(repo.findByIdAndTenantId("a",tenant)).thenReturn(Optional.of(activity));}
    @AfterEach void cleanup(){TenantContext.clear();}
    PlanningNeed add(String type){return service.add("c","a",type,"Béton",BigDecimal.TEN,"m3",2,10);}
    @Test void createsAndRemovesNeed(){var need=add("MATIERE");assertThat(activity.getPlanningNeeds()).containsExactly(need);service.remove("c","a",need.id());assertThat(activity.getPlanningNeeds()).isEmpty();}
    @Test void rejectsInvalidQuantityAndCrossChantier(){assertThatThrownBy(()->service.add("c","a","MATIERE","x",BigDecimal.ZERO,"m3",0,0)).isInstanceOf(IllegalArgumentException.class);assertThatThrownBy(()->service.add("other","a","MATIERE","x",BigDecimal.ONE,"m3",0,0)).hasMessageContaining("hors chantier");verify(repo,never()).save(any());}
    @Test void purchaseIsDraftWithRelativeDateAndIdempotent(){var need=add("MATIERE");var purchaseId=UUID.randomUUID();when(purchases.create(any())).thenReturn(DemandeAchat.builder().id(purchaseId).numero("DA-QA").build());
        when(chantiers.findByIdAndTenantId("c",tenant)).thenReturn(Optional.of(ma.nafura.chantiers.domain.chantier.Chantier.builder().id("c").code("CH-QA").label("Chantier test").build()));
        var linked=service.preparePurchase("c","a",need.id(),"user");service.preparePurchase("c","a",need.id(),"user");
        var captor=ArgumentCaptor.forClass(DemandeAchatCreateDto.class);verify(purchases,times(1)).create(captor.capture());var request=captor.getValue();
        assertThat(request.getChantierCode()).isEqualTo("CH-QA");assertThat(request.getChantierName()).isEqualTo("Chantier test");
        assertThat(request.getStatus()).isEqualTo("BROUILLON");assertThat(request.getDateBesoin()).isEqualTo(LocalDate.of(2026,10,18));assertThat(request.getLignes()).isEmpty();assertThat(request.getNotes()).contains(need.id()).contains("10 m3");assertThat(linked.demandeId()).isEqualTo(purchaseId.toString());
        assertThatThrownBy(()->service.remove("c","a",need.id())).hasMessageContaining("traçabilité");
    }
    @Test void personnelDoesNotBecomePurchase(){var need=add("PERSONNEL");assertThatThrownBy(()->service.preparePurchase("c","a",need.id(),"user")).hasMessageContaining("ne relève pas");verifyNoInteractions(purchases);}
    @Test void mutationChecksPolicy(){doThrow(new IllegalStateException("forbidden")).when(policy).assertCanEditStructure("c");assertThatThrownBy(()->add("MATIERE")).hasMessage("forbidden");verify(repo,never()).save(any());}
}
