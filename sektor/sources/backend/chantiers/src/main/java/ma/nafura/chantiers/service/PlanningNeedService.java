package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.util.*;
import ma.nafura.chantiers.domain.activite.*;
import ma.nafura.chantiers.repository.ActiviteChantierRepository;
import ma.nafura.chantiers.repository.ChantierRepository;
import ma.nafura.achats.api.request.DemandeAchatCreateDto;
import ma.nafura.achats.service.DemandeAchatService;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

@Service
public class PlanningNeedService {
    private final ActiviteChantierRepository activities;
    private final PlanningPolicy policy;
    private final DemandeAchatService purchases;
    private final ChantierRepository chantiers;
    public PlanningNeedService(ActiviteChantierRepository activities,PlanningPolicy policy,DemandeAchatService purchases,ChantierRepository chantiers) {
        this.activities=activities;this.policy=policy;this.purchases=purchases;this.chantiers=chantiers;
    }
    private ActiviteChantier editable(String chantierId,String activityId) {
        policy.assertCanEditStructure(chantierId);
        var activity=activities.findByIdAndTenantId(activityId,TenantContext.getTenantId())
                .filter(a->chantierId.equals(a.getChantierId())).orElseThrow(()->new IllegalArgumentException("Activité hors chantier."));
        if(activity.getForme()!=ActiviteForme.ACTIVITE) throw new IllegalArgumentException("Les besoins doivent être portés par une activité d’exécution.");
        return activity;
    }
    @Transactional(isolation=Isolation.SERIALIZABLE)
    public PlanningNeed add(String chantierId,String activityId,String type,String label,BigDecimal quantity,String unit,int before,int lead) {
        var activity=editable(chantierId,activityId);
        if(!Set.of("PERSONNEL","MATIERE","MATERIEL","SOUS_TRAITANCE").contains(type)) throw new IllegalArgumentException("Type de besoin invalide.");
        if(label==null || label.isBlank() || label.length()>250 || unit==null || unit.isBlank() || unit.length()>30 || quantity==null || quantity.signum()<=0 || before<0 || before>3650 || lead<0 || lead>3650)
            throw new IllegalArgumentException("Renseignez un libellé, une quantité positive, une unité et des délais valides.");
        var need=new PlanningNeed(UUID.randomUUID().toString(),type,label.trim(),quantity,unit.trim(),before,lead,null,null,null);
        var list=new ArrayList<>(activity.getPlanningNeeds()==null?List.<PlanningNeed>of():activity.getPlanningNeeds());
        list.add(need);activity.setPlanningNeeds(list);activities.save(activity);return need;
    }
    @Transactional(isolation=Isolation.SERIALIZABLE)
    public void remove(String chantierId,String activityId,String needId) {
        var activity=editable(chantierId,activityId);
        var list=new ArrayList<>(activity.getPlanningNeeds()==null?List.<PlanningNeed>of():activity.getPlanningNeeds());
        var need=list.stream().filter(n->n.id().equals(needId)).findFirst().orElseThrow(()->new IllegalArgumentException("Besoin introuvable."));
        if(need.demandeId()!=null) throw new IllegalArgumentException("Une demande liée existe. Conservez ce besoin pour sa traçabilité.");
        list.remove(need);activity.setPlanningNeeds(list);activities.save(activity);
    }
    @Transactional(isolation=Isolation.SERIALIZABLE)
    public PlanningNeed preparePurchase(String chantierId,String activityId,String needId,String userId) {
        var activity=editable(chantierId,activityId);
        var list=new ArrayList<>(activity.getPlanningNeeds()==null?List.<PlanningNeed>of():activity.getPlanningNeeds());
        var need=list.stream().filter(n->n.id().equals(needId)).findFirst().orElseThrow(()->new IllegalArgumentException("Besoin introuvable."));
        if(need.demandeId()!=null) return need;
        if(!Set.of("MATIERE","MATERIEL").contains(need.type())) throw new IllegalArgumentException("Ce besoin ne relève pas d’une demande d’achat matière ou matériel.");
        var date=activity.getDateDebut().minusDays(need.daysBeforeStart());
        var request=new DemandeAchatCreateDto();request.setChantierId(chantierId);request.setDemandeurId(userId);request.setDateBesoin(date);request.setStatus("BROUILLON");
        var chantier=chantiers.findByIdAndTenantId(chantierId,TenantContext.getTenantId()).orElseThrow(()->new IllegalArgumentException("Chantier introuvable."));
        request.setChantierCode(chantier.getCode());request.setChantierName(chantier.getLabel());
        request.setMotif(need.label()+" — "+activity.getLibelle());
        request.setNotes("Besoin planning "+need.id()+" ; activité "+activityId+" ; quantité : "+need.quantity()+" "+need.unit()+". Compléter les articles et les prix avant soumission.");
        var purchase=purchases.create(request);
        var linked=new PlanningNeed(need.id(),need.type(),need.label(),need.quantity(),need.unit(),need.daysBeforeStart(),need.leadDays(),purchase.getId().toString(),purchase.getNumero(),date);
        list.set(list.indexOf(need),linked);activity.setPlanningNeeds(list);activities.save(activity);return linked;
    }
}
