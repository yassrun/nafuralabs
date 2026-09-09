package ma.nafura.chantiers.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.util.*;
import ma.nafura.chantiers.domain.activite.*;
import ma.nafura.chantiers.repository.*;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class PlanningNetworkService {
    private final ActiviteChantierRepository activities;
    private final ActivitePrecedenceRepository links;
    private final CalendrierChantierService calendars;
    private final PlanningPolicy policy;
    public PlanningNetworkService(ActiviteChantierRepository activities, ActivitePrecedenceRepository links,
                                  CalendrierChantierService calendars, PlanningPolicy policy) {
        this.activities=activities; this.links=links; this.calendars=calendars; this.policy=policy;
    }
    public record Proposal(String id,String label,LocalDate previousStart,LocalDate previousFinish,
                           LocalDate start,LocalDate finish,LocalDate latestStart,long floatDays,boolean critical,boolean changed) {}
    public record Simulation(String token,List<Proposal> rows,LocalDate finish,String precision) {}
    @Transactional(readOnly=true)
    public Simulation simulate(String chantierId) {
        policy.assertCanRead(chantierId);
        var tenant=TenantContext.getTenantId();
        var all=activities.findByTenantIdAndChantierIdOrderByOrdreAscLibelleAsc(tenant,chantierId);
        var edges=links.findByTenantIdAndChantierId(tenant,chantierId);
        var defaultCalendar=calendars.calculatorFor(chantierId);
        List<PlanningNetwork.Task> tasks=new ArrayList<>();
        for(var a:all) {
            if(a.getForme()==ActiviteForme.PHASE) continue;
            if(!ActiviteChantier.STATUS_PLANIFIE.equals(a.getStatus()))
                throw new IllegalArgumentException("La simulation nécessite des activités planifiées. Le réalisé ne peut pas être déplacé par ce calcul.");
            boolean milestone=a.getForme()==ActiviteForme.JALON;
            if(!milestone && a.getDureeMinutesOuvrees()==null)
                throw new IllegalArgumentException("Renseignez la durée ouvrée de « "+a.getLibelle()+" » avant le calcul.");
            tasks.add(new PlanningNetwork.Task(a.getId(),a.getLibelle(),a.getDateDebut(),
                    milestone?0:a.getDureeMinutesOuvrees(),milestone,
                    a.getCalendrierSpecifique()==null?defaultCalendar:a.getCalendrierSpecifique().calculator()));
        }
        var result=PlanningNetwork.calculate(tasks,edges.stream()
                .map(e->new PlanningNetwork.Link(e.getPredActiviteId(),e.getSuccActiviteId(),e.getTypeLien())).toList());
        var originals=new HashMap<String,ActiviteChantier>(); all.forEach(a->originals.put(a.getId(),a));
        var rows=result.rows().stream().map(r->{var old=originals.get(r.id());
            return new Proposal(r.id(),r.label(),old.getDateDebut(),old.getDateFin(),r.start(),r.finish(),r.latestStart(),r.floatDays(),r.critical(),
                    !r.start().equals(old.getDateDebut()) || !r.finish().equals(old.getDateFin()));}).toList();
        String snapshot=all.stream().sorted(Comparator.comparing(ActiviteChantier::getId)).toList().toString()+edges.stream().sorted(Comparator.comparing(ActivitePrecedence::getId)).toList().toString()+calendars.find(chantierId).toString();
        try {
            String token=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(snapshot.getBytes(StandardCharsets.UTF_8)));
            return new Simulation(token,rows,result.finish(),"JOUR");
        } catch(java.security.NoSuchAlgorithmException e) {throw new IllegalStateException(e);}
    }
    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.SERIALIZABLE)
    public Simulation apply(String chantierId,String token) {
        policy.assertCanEditStructure(chantierId);
        var simulation=simulate(chantierId);
        if(!simulation.token().equals(token)) throw new ResponseStatusException(HttpStatus.CONFLICT,"Le planning a changé. Relancez la simulation.");
        for(var row:simulation.rows()) if(row.changed()) {
            var activity=activities.findByIdAndTenantId(row.id(),TenantContext.getTenantId()).orElseThrow();
            activity.setDateDebut(row.start()); activity.setDateFin(row.finish()); activities.save(activity);
        }
        return simulation;
    }
}
