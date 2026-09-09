package ma.nafura.chantiers.domain.activite;

import java.time.LocalDate;
import java.util.*;

/** Remaining-work forecast on the same activity; quantities, actual progress and purchasing identities are preserved. */
public record PlanningRemainder(LocalDate statusDate,LocalDate resumeStart,int minutes,List<Pause> pauses) {
    public PlanningRemainder { pauses=pauses==null?List.of():List.copyOf(pauses); }
    public record Pause(LocalDate from,LocalDate through) {}
    public boolean includes(LocalDate day){return pauses.stream().noneMatch(p->!day.isBefore(p.from())&&!day.isAfter(p.through()));}
    public PlanningRemainder rescheduled(LocalDate resume){
        if(resume.equals(resumeStart))return this;
        if(resume.isBefore(resumeStart))throw new IllegalArgumentException("Une reprise ne peut pas être avancée par un report.");
        var next=new ArrayList<>(pauses);next.add(new Pause(resumeStart,resume.minusDays(1)));
        return new PlanningRemainder(statusDate,resume,minutes,next);
    }
    public static PlanningRemainder report(ActiviteChantier activity,LocalDate statusDate,LocalDate resume,int minutes){
        var previous=activity.getPlanningRemainder();var pauses=new ArrayList<>(previous==null?List.<Pause>of():previous.pauses());
        var stop=activity.getDateFin().isBefore(statusDate)?activity.getDateFin():statusDate;
        if(stop.plusDays(1).isBefore(resume))pauses.add(new Pause(stop.plusDays(1),resume.minusDays(1)));
        return new PlanningRemainder(statusDate,resume,minutes,pauses);
    }
}
