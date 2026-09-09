package ma.nafura.chantiers.service;
import java.time.LocalDate;
import java.util.*;
import ma.nafura.chantiers.domain.activite.*;
import ma.nafura.chantiers.repository.*;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlanningResourceService {
    private final ActiviteChantierRepository activities;
    private final ChantierAffectationRepository affectations;
    private final CalendrierChantierService calendars;
    private final PlanningPolicy policy;
    public PlanningResourceService(ActiviteChantierRepository activities,ChantierAffectationRepository affectations,CalendrierChantierService calendars,PlanningPolicy policy) {
        this.activities=activities;this.affectations=affectations;this.calendars=calendars;this.policy=policy;
    }
    public record Day(String employeId,LocalDate date,int reservedMinutes,long calendarMinutes,boolean overload,List<String> activityIds) {}
    @Transactional
    public void reserve(String chantierId,String activityId,String affectationId,int minutes) {
        policy.assertCanEditStructure(chantierId);
        var tenant=TenantContext.getTenantId();
        var activity=activities.findByIdAndTenantId(activityId,tenant).filter(a->chantierId.equals(a.getChantierId())).orElseThrow(()->new IllegalArgumentException("Activité hors chantier."));
        if(activity.getForme()!=ActiviteForme.ACTIVITE) throw new IllegalArgumentException("Réservez les ressources sur une activité, pas une phase ou un jalon.");
        if(minutes<0 || minutes>1440) throw new IllegalArgumentException("La réservation doit être comprise entre 0 et 24 heures par jour.");
        if(minutes>0) {
            var assignment=affectations.findByIdAndTenantId(affectationId,tenant).filter(a->chantierId.equals(a.getChantierId())).orElseThrow(()->new IllegalArgumentException("Affectation hors chantier."));
            if(!assignment.isEffectiveOn(activity.getDateDebut()) || !assignment.isEffectiveOn(activity.getDateFin()))
                throw new IllegalArgumentException("L’affectation du collaborateur doit couvrir toute la période de l’activité.");
        }
        List<PlanningAllocation> allocations=new ArrayList<>(activity.getPlanningAllocations()==null?List.of():activity.getPlanningAllocations());
        allocations.removeIf(a->affectationId.equals(a.affectationId()));
        if(minutes>0) allocations.add(new PlanningAllocation(affectationId,minutes));
        activity.setPlanningAllocations(allocations); activities.save(activity);
    }
    @Transactional(readOnly=true)
    public List<Day> week(String chantierId,LocalDate start) {
        policy.assertCanRead(chantierId);
        var tenant=TenantContext.getTenantId();
        var assignments=affectations.findByTenantIdAndChantierIdAndIsActiveTrueOrderByRoleCodeAscEmployeIdAsc(tenant,chantierId);
        var byAssignment=new HashMap<String,String>(); assignments.forEach(a->byAssignment.put(a.getId(),a.getEmployeId()));
        var all=activities.findByTenantIdAndChantierIdOrderByOrdreAscLibelleAsc(tenant,chantierId);
        var base=calendars.calculatorFor(chantierId);
        List<Day> result=new ArrayList<>();
        for(String employee:new LinkedHashSet<>(byAssignment.values())) for(int i=0;i<7;i++) {
            LocalDate date=start.plusDays(i); int total=0; List<String> ids=new ArrayList<>();
            for(var activity:all) {
                if(activity.getPlanningAllocations()==null || date.isBefore(activity.getDateDebut()) || date.isAfter(activity.getDateFin())) continue;
                var calendar=activity.getCalendrierSpecifique()==null?base:activity.getCalendrierSpecifique().calculator();
                if(calendar.minutesOuvrees(date)==0) continue;
                for(var allocation:activity.getPlanningAllocations()) if(employee.equals(byAssignment.get(allocation.affectationId()))) {
                    total+=allocation.minutesParJour(); ids.add(activity.getId());
                }
            }
            long capacity=base.minutesOuvrees(date);
            result.add(new Day(employee,date,total,capacity,total>capacity,List.copyOf(ids)));
        }
        return result;
    }
}
