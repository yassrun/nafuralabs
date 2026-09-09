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
    private final ma.nafura.rh.repository.CongeRepository leaves;
    public PlanningResourceService(ActiviteChantierRepository activities,ChantierAffectationRepository affectations,CalendrierChantierService calendars,PlanningPolicy policy,ma.nafura.rh.repository.CongeRepository leaves) {
        this.activities=activities;this.affectations=affectations;this.calendars=calendars;this.policy=policy;this.leaves=leaves;
    }
    public record Day(String employeId,LocalDate date,int reservedMinutes,long calendarMinutes,boolean overload,List<String> activityIds,
                      int otherReservedMinutes,boolean approvedAbsence,boolean partialAbsence) {}
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
        var base=calendars.calculatorFor(chantierId);
        var employees=assignments.stream().filter(a->!a.getDateDebut().isAfter(start.plusDays(6)) && (a.getDateFin()==null || !a.getDateFin().isBefore(start)))
                .map(a->a.getEmployeId()).collect(java.util.stream.Collectors.toCollection(TreeSet::new));
        if(employees.isEmpty()) return List.of();
        var related=affectations.findByTenantIdAndEmployeIdInAndIsActiveTrue(tenant,employees);
        var byAssignment=new HashMap<String,ma.nafura.chantiers.domain.chantier.ChantierAffectation>();
        related.forEach(a->byAssignment.put(a.getId(),a));
        var chantierIds=related.stream().map(a->a.getChantierId()).collect(java.util.stream.Collectors.toSet());
        chantierIds.add(chantierId);
        var all=activities.findByTenantIdAndChantierIdInAndDateDebutLessThanEqualAndDateFinGreaterThanEqual(tenant,chantierIds,start.plusDays(6),start);
        var absences=leaves.findByTenantIdAndEmployeIdInAndStatusInAndDateDebutLessThanEqualAndDateFinGreaterThanEqual(
                tenant,employees,Set.of("APPROUVE","EN_COURS","SOLDE"),start.plusDays(6),start);
        var calculators=new HashMap<String,ma.nafura.chantiers.domain.calendrier.CalendrierOuvreCalculator>();
        calculators.put(chantierId,base);
        List<Day> result=new ArrayList<>();
        for(String employee:employees) for(int i=0;i<7;i++) {
            LocalDate date=start.plusDays(i); int total=0,other=0; long capacity=base.minutesOuvrees(date); List<String> ids=new ArrayList<>();
            if(assignments.stream().noneMatch(a->employee.equals(a.getEmployeId()) && a.isEffectiveOn(date))) continue;
            for(var activity:all) {
                if(activity.getForme()!=ActiviteForme.ACTIVITE || activity.getPlanningAllocations()==null || !activity.plannedOn(date)) continue;
                for(var allocation:activity.getPlanningAllocations()) {
                    var assignment=byAssignment.get(allocation.affectationId());
                    if(assignment==null || !employee.equals(assignment.getEmployeId()) || !activity.getChantierId().equals(assignment.getChantierId()) || !assignment.isEffectiveOn(date)) continue;
                    var calendar=activity.getCalendrierSpecifique()==null
                            ?calculators.computeIfAbsent(activity.getChantierId(),calendars::calculatorForResourceAggregation)
                            :activity.getCalendrierSpecifique().calculator();
                    long worked=calendar.minutesOuvrees(date);
                    if(worked==0) continue;
                    capacity=Math.max(capacity,worked);
                    if(chantierId.equals(activity.getChantierId())) {total+=allocation.minutesParJour();ids.add(activity.getId());}
                    else other+=allocation.minutesParJour();
                }
            }
            var onDate=absences.stream().filter(a->employee.equals(a.getEmployeId()) && !date.isBefore(a.getDateDebut()) && !date.isAfter(a.getDateFin())).toList();
            boolean absent=onDate.stream().anyMatch(a->a.getNombreJours()!=null && a.getNombreJours().signum()>0 && a.getNombreJours().remainder(java.math.BigDecimal.ONE).signum()==0);
            boolean partial=onDate.stream().anyMatch(a->a.getNombreJours()==null || a.getNombreJours().signum()<=0 || a.getNombreJours().remainder(java.math.BigDecimal.ONE).signum()!=0);
            result.add(new Day(employee,date,total,capacity,total+other>capacity,List.copyOf(new TreeSet<>(ids)),other,absent,partial));
        }
        return result;
    }
}
