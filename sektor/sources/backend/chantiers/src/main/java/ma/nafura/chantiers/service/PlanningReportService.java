package ma.nafura.chantiers.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.*;
import java.time.temporal.*;
import java.util.*;
import ma.nafura.chantiers.domain.activite.*;
import ma.nafura.chantiers.repository.*;
import ma.nafura.platform.framework.context.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PlanningReportService {
    private final PlanningReportRepository reports;
    private final ActiviteChantierRepository activities;
    private final ChantierRepository chantiers;
    private final PlanningNetworkService network;
    private final PlanningWeekService weeks;
    private final PlanningPolicy policy;
    private final ObjectMapper json;
    public PlanningReportService(PlanningReportRepository reports,ActiviteChantierRepository activities,ChantierRepository chantiers,
            PlanningNetworkService network,PlanningWeekService weeks,PlanningPolicy policy,ObjectMapper json){
        this.reports=reports;this.activities=activities;this.chantiers=chantiers;this.network=network;this.weeks=weeks;this.policy=policy;this.json=json;
    }
    public record Remaining(LocalDate statusDate,int minutes) {}
    public record Request(LocalDate sourceWeek,LocalDate targetWeek,List<String> activityIds,Map<String,Remaining> remaining) {
        public Request(LocalDate sourceWeek,LocalDate targetWeek,List<String> activityIds){this(sourceWeek,targetWeek,activityIds,Map.of());}
        public Request {remaining=remaining==null?Map.of():Map.copyOf(remaining);}
    }
    public record WeekImpact(LocalDate start,String status,int revision,String token,Long version) {}
    public record Preview(String token,Request request,List<PlanningNetworkService.Proposal> changes,List<WeekImpact> weeks,List<String> checks,LocalDate finish) {}
    public record Propose(Request request,String token,String reason) {}
    public record Decide(Long version,String action,String note) {}
    public record View(String id,Long version,String status,String proposedBy,Instant proposedAt,String reason,Preview preview,String decidedBy,Instant decidedAt,String decisionNote,boolean canDecide,boolean canCancel) {}

    @Transactional(readOnly=true)
    public List<View> list(String id){check(id);return reports.findByTenantIdAndChantierIdOrderByProposedAtDesc(TenantContext.getTenantId(),id).stream().map(this::view).toList();}
    @Transactional(readOnly=true)
    public Preview preview(String id,Request request){
        check(id);validate(request);
        var all=activities.findByTenantIdAndChantierIdOrderByOrdreAscLibelleAsc(TenantContext.getTenantId(),id);
        Map<String,LocalDate> starts=new TreeMap<>();long offset=ChronoUnit.DAYS.between(request.sourceWeek(),request.targetWeek());
        Map<String,PlanningRemainder> remainders=new TreeMap<>();
        if(!new HashSet<>(request.activityIds()).containsAll(request.remaining().keySet()))throw bad("Le reste à faire doit concerner les activités sélectionnées.");
        for(String activityId:request.activityIds()){
            var a=all.stream().filter(x->x.getId().equals(activityId)).findFirst().orElseThrow(()->bad("Activité absente du chantier."));
            if(a.getForme()!=ActiviteForme.ACTIVITE || ActiviteChantier.STATUS_TERMINE.equals(a.getStatus()) || (a.getAvancementPercent()!=null&&a.getAvancementPercent().compareTo(java.math.BigDecimal.valueOf(100))>=0))throw bad("Une phase, un jalon ou une activité terminée ne peut pas être reporté comme reste à faire.");
            boolean begun=!ActiviteChantier.STATUS_PLANIFIE.equals(a.getStatus()) || (a.getAvancementPercent()!=null&&a.getAvancementPercent().signum()>0) || a.getPlanningRemainder()!=null;
            var remaining=request.remaining().get(activityId);
            if(begun){
                if(remaining==null)throw bad("Activité commencée : précisez la date d’arrêté et les heures restantes. Seules les activités non commencées peuvent être reportées en bloc.");
                if(remaining.minutes()<=0||remaining.minutes()>1440*366||remaining.statusDate()==null||remaining.statusDate().isAfter(LocalDate.now())||remaining.statusDate().isBefore(a.getDateDebut())||remaining.statusDate().isBefore(request.sourceWeek())||remaining.statusDate().isAfter(request.sourceWeek().plusDays(6))||!request.targetWeek().isAfter(remaining.statusDate()))throw bad("Précisez des heures restantes positives et une date d’arrêté dans la semaine de départ, entre le début enregistré et aujourd’hui.");
                var old=a.getPlanningRemainder();
                if(old!=null&&(remaining.statusDate().isBefore(old.statusDate())||!request.targetWeek().isAfter(old.resumeStart())))throw bad("La nouvelle reprise doit suivre la précédente et conserver un arrêté chronologique.");
                remainders.put(activityId,PlanningRemainder.report(a,remaining.statusDate(),request.targetWeek(),remaining.minutes()));continue;
            }
            if(remaining!=null)throw bad("Le reste à faire s’applique à une activité commencée ; reportez cette activité en bloc.");
            if(a.getDateDebut().isBefore(request.sourceWeek())||a.getDateDebut().isAfter(request.sourceWeek().plusDays(6)))throw bad("L’activité doit commencer dans la semaine de départ. Le report du reste à faire demande un découpage préalable.");
            starts.put(a.getId(),a.getDateDebut().plusDays(offset));
        }
        var simulation=network.simulateWithRemainders(id,starts,remainders);
        var changes=simulation.rows().stream().filter(PlanningNetworkService.Proposal::changed).toList();
        if(changes.isEmpty())throw bad("Aucune date à reporter.");
        Set<LocalDate> affected=new TreeSet<>();Set<String> checks=new TreeSet<>();
        for(var row:changes){
            addWeeks(affected,row.previousStart(),row.previousFinish());addWeeks(affected,row.start(),row.finish());
            var a=all.stream().filter(x->x.getId().equals(row.id())).findFirst().orElseThrow();
            if(!row.start().equals(a.getDateDebut()) && (a.getPlanningRemainder()!=null||!ActiviteChantier.STATUS_PLANIFIE.equals(a.getStatus())||(a.getAvancementPercent()!=null&&a.getAvancementPercent().signum()>0)))throw bad("Le report déplacerait le début d’une activité ayant du réalisé : "+a.getLibelle());
            if(remainders.containsKey(row.id()))checks.add(a.getLibelle()+" : début et avancement conservés ; reprise le "+row.workStart()+" pour "+(remainders.get(row.id()).minutes()/60.0)+" h restantes. Les réservations sont libérées pendant la pause.");
            if(a.getPlanningAllocations()!=null&&!a.getPlanningAllocations().isEmpty())checks.add(a.getLibelle()+" : "+a.getPlanningAllocations().size()+" réservation(s) suivront les nouvelles dates ; disponibilité à recontrôler avant validation de la semaine.");
            if(a.getPlanningNeeds()!=null)for(var need:a.getPlanningNeeds()){
                if(remainders.containsKey(row.id())||a.getPlanningRemainder()!=null){checks.add(a.getLibelle()+" · "+need.label()+" : besoin existant conservé sans duplication. Vérifiez les quantités restant à fournir et les dates des achats pour la reprise.");continue;}
                var date=row.start().minusDays(need.daysBeforeStart());
                checks.add(a.getLibelle()+" · "+need.label()+" : besoin le "+date+", lancement le "+date.minusDays(need.leadDays())+(need.demandeId()!=null?". La demande d’achat existante conserve sa date : rapprochement nécessaire.":"."));
            }
        }
        List<WeekImpact> impacts=new ArrayList<>();
        for(var start:affected){var w=weeks.read(id,start);impacts.add(new WeekImpact(start,w.status(),w.revision(),w.token(),w.version()));}
        String token=hash(encode(List.of(simulation.token(),request,impacts,checks)));
        return new Preview(token,request,changes,List.copyOf(impacts),List.copyOf(checks),simulation.finish());
    }
    @Transactional(isolation=Isolation.SERIALIZABLE)
    public View propose(String id,Propose command){
        check(id);policy.assertCanPrepareWeek(id);String actor=actor();note(command.reason());
        var preview=preview(id,command.request());if(!preview.token().equals(command.token()))throw conflict("Le planning ou les semaines ont changé. Recalculez l’aperçu.");
        var report=new PlanningReport();report.setId(UUID.randomUUID().toString());report.setTenantId(TenantContext.getTenantId());report.setChantierId(id);report.setStatus("PROPOSE");
        report.setProposedBy(actor);report.setProposedAt(Instant.now());report.setReason(command.reason().trim());report.setRequest(encode(command.request()));report.setPreview(encode(preview));
        return view(reports.saveAndFlush(report));
    }
    @Transactional(isolation=Isolation.SERIALIZABLE)
    public View decide(String id,String reportId,Decide command){
        check(id);String actor=actor();
        var report=reports.findByIdAndTenantIdAndChantierId(reportId,TenantContext.getTenantId(),id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Report introuvable."));
        if(!Objects.equals(report.getVersion(),command.version())||!"PROPOSE".equals(report.getStatus()))throw conflict("Ce report a déjà changé. Actualisez.");
        note(command.note());
        if("CANCEL".equals(command.action())){
            policy.assertCanPrepareWeek(id);if(!actor.equals(report.getProposedBy()))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Seul l’auteur peut retirer sa proposition.");report.setStatus("ANNULE");
        }else{
            policy.assertCanValidateWeek(id);if(actor.equals(report.getProposedBy()))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Une autre personne habilitée doit décider du report.");
            if("APPROVE".equals(command.action())){
                var previous=decode(report.getPreview(),Preview.class);var fresh=preview(id,decode(report.getRequest(),Request.class));
                if(!fresh.token().equals(previous.token()))throw conflict("L’impact du report a changé. Retirez cette proposition et préparez un nouvel aperçu.");
                for(var row:fresh.changes()){
                    var activity=activities.findByIdAndTenantId(row.id(),TenantContext.getTenantId()).filter(a->id.equals(a.getChantierId())).orElseThrow();
                    var remaining=fresh.request().remaining().get(row.id());
                    if(remaining!=null)activity.setPlanningRemainder(PlanningRemainder.report(activity,remaining.statusDate(),row.workStart(),remaining.minutes()));
                    else if(activity.getPlanningRemainder()!=null)activity.setPlanningRemainder(activity.getPlanningRemainder().rescheduled(row.workStart()));
                    activity.setDateDebut(row.start());activity.setDateFin(row.finish());activities.save(activity);
                }
                report.setStatus("APPLIQUE");
            }else if("REJECT".equals(command.action()))report.setStatus("REFUSE");else throw bad("Action inconnue.");
        }
        report.setDecidedBy(actor);report.setDecidedAt(Instant.now());report.setDecisionNote(command.note().trim());return view(reports.saveAndFlush(report));
    }
    private View view(PlanningReport r){boolean own=UserContext.getUserIdOrNull()!=null&&UserContext.getUserIdOrNull().toString().equals(r.getProposedBy());boolean pending="PROPOSE".equals(r.getStatus());
        return new View(r.getId(),r.getVersion(),r.getStatus(),r.getProposedBy(),r.getProposedAt(),r.getReason(),decode(r.getPreview(),Preview.class),r.getDecidedBy(),r.getDecidedAt(),r.getDecisionNote(),pending&&!own&&policy.canValidateWeek(r.getChantierId()),pending&&own&&policy.canPrepareWeek(r.getChantierId()));}
    private void check(String id){policy.assertCanRead(id);if(chantiers.findByIdAndTenantId(id,TenantContext.getTenantId()).isEmpty())throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Chantier introuvable.");}
    private static void validate(Request r){if(r==null||r.sourceWeek()==null||r.targetWeek()==null||r.sourceWeek().getDayOfWeek()!=DayOfWeek.MONDAY||r.targetWeek().getDayOfWeek()!=DayOfWeek.MONDAY||!r.targetWeek().isAfter(r.sourceWeek())||r.targetWeek().isAfter(r.sourceWeek().plusYears(1))||r.activityIds()==null||r.activityIds().isEmpty()||r.activityIds().size()>200||new HashSet<>(r.activityIds()).size()!=r.activityIds().size())throw bad("Choisissez des activités et une semaine ultérieure (lundi, dans l’année).");}
    private static void addWeeks(Set<LocalDate> weeks,LocalDate from,LocalDate to){if(ChronoUnit.DAYS.between(from,to)>366*3)throw bad("La période dépasse trois ans.");for(var day=from.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));!day.isAfter(to);day=day.plusWeeks(1))weeks.add(day);}
    private static void note(String text){if(text==null||text.isBlank()||text.length()>4000)throw bad("Un motif de 1 à 4 000 caractères est obligatoire.");}
    private static String actor(){var id=UserContext.getUserIdOrNull();if(id==null)throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);return id.toString();}
    private String encode(Object value){try{return json.writeValueAsString(value);}catch(Exception e){throw new IllegalStateException(e);}}
    private <T>T decode(String value,Class<T> type){try{return json.readValue(value,type);}catch(Exception e){throw new IllegalStateException(e);}}
    private static String hash(String value){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));}catch(Exception e){throw new IllegalStateException(e);}}
    private static ResponseStatusException bad(String reason){return new ResponseStatusException(HttpStatus.BAD_REQUEST,reason);}
    private static ResponseStatusException conflict(String reason){return new ResponseStatusException(HttpStatus.CONFLICT,reason);}
}
