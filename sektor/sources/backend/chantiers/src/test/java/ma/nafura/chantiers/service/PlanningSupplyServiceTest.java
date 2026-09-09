package ma.nafura.chantiers.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.*;
import ma.nafura.achats.repository.*;
import ma.nafura.achats.domain.demande.DemandeAchat;
import ma.nafura.achats.domain.commande.BonCommandeAchat;
import ma.nafura.achats.domain.reception.ReceptionAchat;
import ma.nafura.chantiers.domain.activite.*;
import ma.nafura.chantiers.repository.ActiviteChantierRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.*;

class PlanningSupplyServiceTest {
    final UUID tenant=UUID.randomUUID(),da=UUID.randomUUID(),bc=UUID.randomUUID();
    final ActiviteChantierRepository activities=mock(ActiviteChantierRepository.class);
    final DemandeAchatRepository demands=mock(DemandeAchatRepository.class);
    final BonCommandeAchatRepository orders=mock(BonCommandeAchatRepository.class);
    final ReceptionAchatRepository receipts=mock(ReceptionAchatRepository.class);
    final PlanningPolicy policy=mock(PlanningPolicy.class);
    final PlanningSupplyService service=new PlanningSupplyService(activities,demands,orders,receipts,policy);
    final LocalDate start=LocalDate.of(2026,9,14);
    ActiviteChantier activity;
    @BeforeEach void setup(){
        TenantContext.setTenantId(tenant);
        activity=ActiviteChantier.builder().id("a").chantierId("c").forme(ActiviteForme.ACTIVITE).libelle("Coulage").dateDebut(start).dateFin(start).build();
        activity.setPlanningNeeds(List.of(new PlanningNeed("n","MATIERE","Béton",BigDecimal.TEN,"m3",2,5,da.toString(),"DA-1",start.minusDays(2))));
        when(activities.findByTenantIdAndChantierIdOrderByOrdreAscLibelleAsc(tenant,"c")).thenReturn(List.of(activity));
    }
    @AfterEach void cleanup(){TenantContext.clear();}
    @Test void readsSourceDatesPartialDeliveriesAndCancelledReceiptsWithoutClaimingNeedFulfilled(){
        when(demands.findByTenantIdAndChantierIdAndIdIn(tenant,"c",Set.of(da))).thenReturn(List.of(DemandeAchat.builder().id(da).status("CONVERTIE").numero("DA-1").dateBesoin(start.minusDays(3)).build()));
        when(orders.findByTenantIdAndChantierIdAndDaIdIn(tenant,"c",Set.of(da.toString()))).thenReturn(List.of(BonCommandeAchat.builder().id(bc).daId(da.toString()).numero("BC-1").status("PARTIELLEMENT_LIVRE").dateLivraisonPrevue(start.plusDays(1)).build()));
        when(receipts.findByTenantIdAndBonCommandeAchatIdIn(tenant,List.of(bc))).thenReturn(List.of(ReceptionAchat.builder().id(UUID.randomUUID()).bonCommandeAchatId(bc).numero("R-1").dateReception(start).status("ANNULE").build()));
        var row=service.read("c").getFirst();
        assertThat(row.launchDate()).isEqualTo(start.minusDays(7));assertThat(row.neededDate()).isEqualTo(start.minusDays(2));
        assertThat(row.demandDate()).isEqualTo(start.minusDays(3));assertThat(row.sourceUnavailable()).isFalse();
        assertThat(row.orders().getFirst().status()).isEqualTo("PARTIELLEMENT_LIVRE");
        assertThat(row.orders().getFirst().receipts().getFirst().status()).isEqualTo("ANNULE");
    }
    @Test void missingOrForeignDemandIsNotExposedAndDoesNotQueryOrders(){
        var row=service.read("c").getFirst();assertThat(row.sourceUnavailable()).isTrue();assertThat(row.demandId()).isNull();
        verifyNoInteractions(orders,receipts);
    }
    @Test void movingActivityRecalculatesDatesWithoutChangingPurchasingSource(){
        activity.setDateDebut(start.plusDays(7));
        assertThat(service.read("c").getFirst().launchDate()).isEqualTo(start);
        verify(demands,never()).save(any());verify(activities,never()).save(any());
    }
    @Test void forbiddenChantierDoesNotReadPurchaseData(){
        doThrow(new IllegalStateException("forbidden")).when(policy).assertCanRead("c");
        assertThatThrownBy(()->service.read("c")).hasMessage("forbidden");verifyNoInteractions(activities,demands,orders,receipts);
    }
}
