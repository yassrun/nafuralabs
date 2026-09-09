package ma.nafura.chantiers.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.*;
import java.util.*;
import ma.nafura.chantiers.domain.activite.*;
import ma.nafura.chantiers.repository.*;
import ma.nafura.platform.framework.context.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PlanningWeekService {
    private final PlanningWeekRepository weeks;
    private final ActiviteChantierRepository activities;
    private final ChantierAffectationRepository assignments;
    private final CalendrierChantierService calendars;
    private final PlanningPolicy policy;
    private final ObjectMapper json;
    private final ChantierRepository chantiers;
    private final PlanningResourceService resources;
    public PlanningWeekService(PlanningWeekRepository weeks,ActiviteChantierRepository activities,
            ChantierAffectationRepository assignments,CalendrierChantierService calendars,PlanningPolicy policy,ObjectMapper json,ChantierRepository chantiers,PlanningResourceService resources) {
        this.weeks=weeks;this.activities=activities;this.assignments=assignments;this.calendars=calendars;this.policy=policy;this.json=json;this.chantiers=chantiers;this.resources=resources;
    }
    public record Row(String id,String label,LocalDate start,LocalDate finish,Integer minutes,
                      Object calendar,List<PlanningAllocation> allocations,List<PlanningNeed> needs) {}
    public record Snapshot(List<Row> activities,String calendar,List<String> assignmentCoverage,List<String> conflicts) {}
    public record View(Long version,int revision,String status,String note,boolean changed,String token,
                       Snapshot current,Snapshot submitted,List<PlanningWeek.Event> history,boolean canPrepare,boolean canDecide,boolean ownPreparation) {}
    public record Command(Long version,String token,String note) {}

    @Transactional(readOnly=true)
    public View read(String chantierId,LocalDate start) {
        policy.assertCanRead(chantierId);checkMonday(start);requireChantier(chantierId);
        return view(chantierId,start,find(chantierId,start).orElse(null));
    }

    @Transactional(isolation=Isolation.SERIALIZABLE)
    public View command(String chantierId,LocalDate start,String action,Command command) {
        checkMonday(start);policy.assertCanRead(chantierId);requireChantier(chantierId);
        String actor=actor();
        boolean deciding=Set.of("APPROVE","REJECT").contains(action);
        if(deciding) policy.assertCanValidateWeek(chantierId);else policy.assertCanPrepareWeek(chantierId);
        if(command.note()!=null && command.note().length()>4000) throw bad("La note est limitée à 4 000 caractères.");
        var week=find(chantierId,start).orElse(null);
        if(!Objects.equals(command.version(),week==null?null:week.getVersion())) throw conflict("La semaine a changé. Rechargez avant de continuer.");
        var snapshot=snapshot(chantierId,start);String encoded=encode(snapshot),token=hash(encoded);
        if(!token.equals(command.token())) throw conflict("Les activités ou les moyens ont changé. Rechargez la semaine.");
        if(week==null) {
            if(!"SAVE".equals(action)) throw bad("Enregistrez d’abord la préparation.");
            week=new PlanningWeek();week.setId(UUID.randomUUID().toString());week.setTenantId(TenantContext.getTenantId());
            week.setChantierId(chantierId);week.setWeekStart(start);week.setRevision(1);week.setStatus("BROUILLON");
        }
        if(deciding && week.getContributors().contains(actor)) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Vous avez participé à cette préparation : une autre personne doit décider.");
        switch(action) {
            case "SAVE" -> {
                requireStatus(week,"BROUILLON");contribute(week,actor);week.setNote(command.note());week.setSnapshot(encoded);week.setToken(token);
            }
            case "SUBMIT" -> {
                requireStatus(week,"BROUILLON");requireUnchanged(week,token);
                if(snapshot.activities().isEmpty()) throw bad("Aucune activité à soumettre sur cette semaine.");
                contribute(week,actor);week.setStatus("SOUMISE");
            }
            case "APPROVE" -> {
                requireStatus(week,"SOUMISE");requireUnchanged(week,token);
                if(!snapshot.conflicts().isEmpty()) throw conflict("Corrigez les affectations indisponibles ou les réservations pendant un congé approuvé avant validation.");
                week.setStatus("VALIDEE");
            }
            case "REJECT" -> {
                requireStatus(week,"SOUMISE");
                if(command.note()==null || command.note().isBlank()) throw bad("Précisez les corrections demandées.");
                week.setStatus("A_CORRIGER");
            }
            case "REVISE" -> {
                if("BROUILLON".equals(week.getStatus())) throw bad("Cette semaine est déjà en préparation.");
                if(command.note()==null || command.note().isBlank()) throw bad("Précisez le motif de la révision ou du report.");
                week.setRevision(week.getRevision()+1);week.setStatus("BROUILLON");contribute(week,actor);
                week.setSnapshot(encoded);week.setToken(token);week.setNote(command.note());
            }
            default -> throw bad("Action inconnue.");
        }
        var history=new ArrayList<>(week.getHistory());
        history.add(new PlanningWeek.Event(week.getRevision(),action,actor,Instant.now(),command.note(),week.getSnapshot()));
        week.setHistory(history);weeks.saveAndFlush(week);
        return view(chantierId,start,week);
    }

    private View view(String chantierId,LocalDate start,PlanningWeek week) {
        Snapshot current=snapshot(chantierId,start);String token=hash(encode(current));
        boolean changed=week!=null && !token.equals(week.getToken());
        boolean own=week!=null && UserContext.getUserIdOrNull()!=null && week.getContributors().contains(UserContext.getUserIdOrNull().toString());
        String state=week==null?"NON_PREPAREE":week.getStatus();
        if(changed && "VALIDEE".equals(state)) state="A_REVALIDER";
        if(changed && "SOUMISE".equals(state)) state="A_RESOUMETTRE";
        return new View(week==null?null:week.getVersion(),week==null?0:week.getRevision(),state,week==null?"":week.getNote(),changed,token,
                current,week==null?null:decode(week.getSnapshot()),week==null?List.of():week.getHistory(),policy.canPrepareWeek(chantierId),policy.canValidateWeek(chantierId)&&!own,own);
    }
    private Snapshot snapshot(String chantierId,LocalDate start) {
        var tenant=TenantContext.getTenantId();var finish=start.plusDays(6);
        var all=activities.findByTenantIdAndChantierIdOrderByOrdreAscLibelleAsc(tenant,chantierId).stream()
                .filter(a->a.getForme()==ActiviteForme.ACTIVITE && !a.getDateDebut().isAfter(finish) && !a.getDateFin().isBefore(start))
                .sorted(Comparator.comparing(ActiviteChantier::getId)).toList();
        List<Row> rows=new ArrayList<>();Set<String> coverage=new TreeSet<>();Set<String> conflicts=new TreeSet<>();
        for(var a:all) {
            var allocations=a.getPlanningAllocations()==null?List.<PlanningAllocation>of():a.getPlanningAllocations();
            rows.add(new Row(a.getId(),a.getLibelle(),a.getDateDebut(),a.getDateFin(),a.getDureeMinutesOuvrees(),a.getCalendrierSpecifique(),
                    allocations.stream().sorted(Comparator.comparing(PlanningAllocation::affectationId)).toList(),
                    a.getPlanningNeeds()==null?List.of():a.getPlanningNeeds().stream().sorted(Comparator.comparing(PlanningNeed::id)).toList()));
            for(var allocation:allocations) {
                var assignment=assignments.findByIdAndTenantId(allocation.affectationId(),tenant).filter(x->chantierId.equals(x.getChantierId()));
                coverage.add(assignment.map(x->x.getId()+":"+x.getEmployeId()+":"+x.getDateDebut()+":"+x.getDateFin()+":"+x.getIsActive()).orElse(allocation.affectationId()+":absente"));
                var calculator=a.getCalendrierSpecifique()==null?calendars.calculatorFor(chantierId):a.getCalendrierSpecifique().calculator();
                for(var day=start;!day.isAfter(finish);day=day.plusDays(1)) {
                    LocalDate d=day;
                    if(!d.isBefore(a.getDateDebut()) && !d.isAfter(a.getDateFin()) && calculator.minutesOuvrees(d)>0 && assignment.filter(x->x.isEffectiveOn(d)).isEmpty())
                        conflicts.add(a.getLibelle()+" : affectation indisponible le "+d);
                }
            }
        }
        for(var day:resources.week(chantierId,start)) {
            if(day.reservedMinutes()>0 && day.approvedAbsence()) {
                coverage.add("absence:"+day.employeId()+":"+day.date());
                conflicts.add("Collaborateur "+day.employeId()+" : congé approuvé le "+day.date());
            }
        }
        return new Snapshot(rows,calendars.find(chantierId).toString(),List.copyOf(coverage),List.copyOf(conflicts));
    }
    private Optional<PlanningWeek> find(String id,LocalDate start) {return weeks.findByTenantIdAndChantierIdAndWeekStart(TenantContext.getTenantId(),id,start);}
    private void requireChantier(String id) {if(chantiers.findByIdAndTenantId(id,TenantContext.getTenantId()).isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Chantier introuvable.");}
    private static void contribute(PlanningWeek week,String actor) {var ids=new ArrayList<>(week.getContributors());if(!ids.contains(actor))ids.add(actor);week.setContributors(ids);}
    private static void requireStatus(PlanningWeek week,String status) {if(!status.equals(week.getStatus()))throw conflict("Action incompatible avec l’état de la semaine.");}
    private static void requireUnchanged(PlanningWeek week,String token) {if(!token.equals(week.getToken()))throw conflict("La préparation a changé. Enregistrez une nouvelle révision.");}
    private static String actor() {var id=UserContext.getUserIdOrNull();if(id==null)throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);return id.toString();}
    private static void checkMonday(LocalDate start) {if(start==null || start.getDayOfWeek()!=DayOfWeek.MONDAY)throw bad("La semaine commence un lundi.");}
    private String encode(Object value) {try{return json.writeValueAsString(value);}catch(Exception e){throw new IllegalStateException(e);}}
    private Snapshot decode(String value) {try{return json.readValue(value,Snapshot.class);}catch(Exception e){throw new IllegalStateException(e);}}
    private static String hash(String value) {try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));}catch(Exception e){throw new IllegalStateException(e);}}
    private static ResponseStatusException bad(String reason) {return new ResponseStatusException(HttpStatus.BAD_REQUEST,reason);}
    private static ResponseStatusException conflict(String reason) {return new ResponseStatusException(HttpStatus.CONFLICT,reason);}
}
