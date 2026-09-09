package ma.nafura.chantiers.domain.activite;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import ma.nafura.chantiers.domain.calendrier.CalendrierOuvreCalculator;

/** Daily CPM. Work finishes on an exclusive day boundary; milestones have zero duration.
 * Existing starts are release dates. This model deliberately does not infer intraday sequencing. */
public final class PlanningNetwork {
    private static final int HORIZON = 366 * 3;
    public record Task(String id, String label, LocalDate start, int minutes, boolean milestone, CalendrierOuvreCalculator calendar) {}
    public record Link(String predecessor, String successor, String type) {}
    public record Row(String id, String label, LocalDate start, LocalDate finish, LocalDate latestStart,
                      long floatDays, boolean critical) {}
    public record Result(List<Row> rows, LocalDate finish) {}

    public static Result calculate(List<Task> tasks, List<Link> links) {
        Map<String,Task> byId = new LinkedHashMap<>();
        tasks.forEach(t -> { if (t.start() == null || (!t.milestone() && t.minutes() <= 0))
            throw new IllegalArgumentException("Chaque activité doit avoir un début et une durée ouvrée positive.");
            if (byId.put(t.id(), t) != null) throw new IllegalArgumentException("Activité dupliquée."); });
        if (tasks.isEmpty()) return new Result(List.of(), null);
        Map<String,List<Link>> incoming = new HashMap<>(), outgoing = new HashMap<>();
        Map<String,Integer> degree = new HashMap<>();
        tasks.forEach(t -> { incoming.put(t.id(),new ArrayList<>()); outgoing.put(t.id(),new ArrayList<>()); degree.put(t.id(),0); });
        for (Link l : links) {
            if (!byId.containsKey(l.predecessor()) || !byId.containsKey(l.successor()))
                throw new IllegalArgumentException("Les liaisons doivent relier des activités ou des jalons, pas des phases.");
            if (!Set.of("FD","DD","FF","DF").contains(l.type())) throw new IllegalArgumentException("Type de liaison invalide.");
            incoming.get(l.successor()).add(l); outgoing.get(l.predecessor()).add(l);
            degree.compute(l.successor(), (id,n) -> n+1);
        }
        ArrayDeque<String> queue = new ArrayDeque<>();
        degree.forEach((id,n) -> { if(n==0) queue.add(id); });
        List<String> order = new ArrayList<>();
        while(!queue.isEmpty()) { String id=queue.remove(); order.add(id);
            for(Link l:outgoing.get(id)) if(degree.compute(l.successor(),(k,n)->n-1)==0) queue.add(l.successor()); }
        if(order.size()!=tasks.size()) throw new IllegalArgumentException("Cycle détecté dans les liaisons.");
        Map<String,LocalDate> starts=new HashMap<>(), ends=new HashMap<>(), latest=new HashMap<>();
        for(String id:order) {
            Task t=byId.get(id); LocalDate start=workingStart(t,t.start(),1);
            for(Link l:incoming.get(id)) {
                LocalDate bound = l.type().startsWith("F") ? ends.get(l.predecessor()) : starts.get(l.predecessor());
                if(l.type().endsWith("D")) start=max(start,workingStart(t,bound,1));
                else if(end(t,start).isBefore(bound)) {
                    LocalDate lo=start, hi=workingStart(t,bound,1);
                    while(lo.isBefore(hi)) { LocalDate mid=lo.plusDays(ChronoUnit.DAYS.between(lo,hi)/2);
                        if(end(t,mid).isBefore(bound)) lo=mid.plusDays(1); else hi=mid; }
                    start=workingStart(t,lo,1);
                }
            }
            starts.put(id,start); ends.put(id,end(t,start));
        }
        LocalDate projectEnd=Collections.max(ends.values());
        List<String> reverse=new ArrayList<>(order); Collections.reverse(reverse);
        for(String id:reverse) {
            Task t=byId.get(id); LocalDate upper=projectEnd;
            LocalDate endLimit=projectEnd;
            for(Link l:outgoing.get(id)) {
                Task successor=byId.get(l.successor());
                LocalDate bound=l.type().endsWith("D") ? latest.get(l.successor()) : end(successor,latest.get(l.successor()));
                if(l.type().startsWith("D")) upper=min(upper,bound); else endLimit=min(endLimit,bound);
            }
            LocalDate lo=starts.get(id), hi=upper;
            while(lo.isBefore(hi)) { LocalDate mid=lo.plusDays((ChronoUnit.DAYS.between(lo,hi)+1)/2);
                if(end(t,mid).isAfter(endLimit)) hi=mid.minusDays(1); else lo=mid; }
            latest.put(id,workingStart(t,lo,-1));
        }
        List<Row> rows=new ArrayList<>();
        for(Task t:tasks) { LocalDate start=starts.get(t.id()), last=latest.get(t.id());
            long slack=0;
            for(LocalDate d=start;d.isBefore(last);d=d.plusDays(1)) if(t.milestone() || t.calendar().minutesOuvrees(d)>0) slack++;
            rows.add(new Row(t.id(),t.label(),start,t.milestone()?start:ends.get(t.id()).minusDays(1),last,slack,slack==0));
        }
        return new Result(List.copyOf(rows), rows.stream().map(Row::finish).max(LocalDate::compareTo).orElse(null));
    }
    private static LocalDate end(Task t,LocalDate start) { return t.milestone()?start:t.calendar().deriveInclusiveFin(start,t.minutes()).plusDays(1); }
    private static LocalDate workingStart(Task t,LocalDate date,int direction) {
        if(t.milestone()) return date;
        for(int i=0;i<HORIZON;i++,date=date.plusDays(direction)) if(t.calendar().minutesOuvrees(date)>0) return date;
        throw new IllegalArgumentException("Aucun créneau ouvré dans l’horizon de calcul.");
    }
    private static LocalDate max(LocalDate a,LocalDate b) { return a.isAfter(b)?a:b; }
    private static LocalDate min(LocalDate a,LocalDate b) { return a.isBefore(b)?a:b; }
}
