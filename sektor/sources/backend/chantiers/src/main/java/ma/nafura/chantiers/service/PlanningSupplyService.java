package ma.nafura.chantiers.service;

import java.time.LocalDate;
import java.util.*;
import ma.nafura.achats.domain.commande.BonCommandeAchat;
import ma.nafura.achats.domain.demande.DemandeAchat;
import ma.nafura.achats.domain.reception.ReceptionAchat;
import ma.nafura.achats.repository.*;
import ma.nafura.chantiers.domain.activite.*;
import ma.nafura.chantiers.repository.ActiviteChantierRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Read-only links to purchasing source documents. Never infers need fulfilment from a whole order. */
@Service
public class PlanningSupplyService {
    private final ActiviteChantierRepository activities;
    private final DemandeAchatRepository demands;
    private final BonCommandeAchatRepository orders;
    private final ReceptionAchatRepository receipts;
    private final PlanningPolicy policy;
    public PlanningSupplyService(ActiviteChantierRepository activities,DemandeAchatRepository demands,
            BonCommandeAchatRepository orders,ReceptionAchatRepository receipts,PlanningPolicy policy) {
        this.activities=activities;this.demands=demands;this.orders=orders;this.receipts=receipts;this.policy=policy;
    }
    public record Receipt(String id,String number,LocalDate date,String status) {}
    public record Order(String id,String number,String status,LocalDate expectedDate,List<Receipt> receipts) {}
    public record Supply(String activityId,String activityLabel,String needId,String label,java.math.BigDecimal quantity,String unit,
                         LocalDate activityStart,LocalDate neededDate,LocalDate launchDate,String demandId,String demandNumber,
                         String demandStatus,LocalDate demandDate,boolean sourceUnavailable,List<Order> orders) {}

    @Transactional(readOnly=true)
    public List<Supply> read(String chantierId) {
        policy.assertCanRead(chantierId);
        var tenant=TenantContext.getTenantId();
        var all=activities.findByTenantIdAndChantierIdOrderByOrdreAscLibelleAsc(tenant,chantierId);
        var demandIds=new HashSet<UUID>();
        for(var a:all) for(var n:needs(a)) if(n.demandeId()!=null) {
            try{demandIds.add(UUID.fromString(n.demandeId()));}catch(IllegalArgumentException ignored){/* Missing source is surfaced below. */}
        }
        Map<String,DemandeAchat> requests=new HashMap<>();
        if(!demandIds.isEmpty()) demands.findByTenantIdAndChantierIdAndIdIn(tenant,chantierId,demandIds).forEach(d->requests.put(d.getId().toString(),d));
        List<BonCommandeAchat> linkedOrders=requests.isEmpty()?List.of():orders.findByTenantIdAndChantierIdAndDaIdIn(tenant,chantierId,requests.keySet());
        Map<UUID,List<Receipt>> received=new HashMap<>();
        if(!linkedOrders.isEmpty()) for(var r:receipts.findByTenantIdAndBonCommandeAchatIdIn(tenant,linkedOrders.stream().map(BonCommandeAchat::getId).toList())) {
            received.computeIfAbsent(r.getBonCommandeAchatId(),k->new ArrayList<>()).add(new Receipt(r.getId().toString(),r.getNumero(),r.getDateReception(),r.getStatus()));
        }
        Map<String,List<Order>> byDemand=new HashMap<>();
        for(var o:linkedOrders) byDemand.computeIfAbsent(o.getDaId(),k->new ArrayList<>()).add(new Order(o.getId().toString(),o.getNumero(),o.getStatus(),o.getDateLivraisonPrevue(),
                received.getOrDefault(o.getId(),List.of()).stream().sorted(Comparator.comparing(Receipt::date).thenComparing(Receipt::id)).toList()));
        List<Supply> result=new ArrayList<>();
        for(var a:all) for(var n:needs(a)) {
            var d=requests.get(n.demandeId());var needed=a.getDateDebut().minusDays(n.daysBeforeStart());
            result.add(new Supply(a.getId(),a.getLibelle(),n.id(),n.label(),n.quantity(),n.unit(),a.getDateDebut(),needed,needed.minusDays(n.leadDays()),
                    d==null?null:d.getId().toString(),d==null?null:d.getNumero(),d==null?null:d.getStatus(),d==null?null:d.getDateBesoin(),
                    n.demandeId()!=null && d==null,byDemand.getOrDefault(n.demandeId(),List.of()).stream().sorted(Comparator.comparing(Order::id)).toList()));
        }
        return result.stream().sorted(Comparator.comparing(Supply::launchDate).thenComparing(Supply::needId)).toList();
    }
    private static List<PlanningNeed> needs(ActiviteChantier a) {
        if(a.getForme()!=ActiviteForme.ACTIVITE || a.getPlanningNeeds()==null) return List.of();
        return a.getPlanningNeeds().stream().filter(n->Set.of("MATIERE","MATERIEL").contains(n.type())).toList();
    }
}
