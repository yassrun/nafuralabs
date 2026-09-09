package ma.nafura.chantiers.domain.calendrier;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/** Full activity-specific schedule; null on an activity means inheritance from its chantier. */
public record CalendrierActivite(String fuseauIana, List<Plage> creneaux, List<ExceptionDate> exceptions) {
    public record Plage(Integer jourSemaine, LocalTime heureDebut, LocalTime heureFin, boolean lendemain) {
        CalendrierOuvreCalculator.Creneau toDomain(boolean weekly) {
            if (weekly && jourSemaine == null) throw new IllegalArgumentException(CalendrierOuvreCalculator.ERR_JOUR_SEMAINE);
            return new CalendrierOuvreCalculator.Creneau(jourSemaine == null ? 1 : jourSemaine, heureDebut, heureFin, lendemain);
        }
    }
    public record ExceptionDate(LocalDate dateLocale, CalendrierExceptionType type, List<Plage> creneaux) {}

    public CalendrierOuvreCalculator calculator() {
        var zone = CalendrierOuvreCalculator.zoneOrThrow(fuseauIana);
        if (creneaux == null || creneaux.isEmpty()) throw new IllegalArgumentException(CalendrierOuvreCalculator.ERR_SANS_PLAGE);
        var slots = creneaux.stream().map(p -> p.toDomain(true)).toList();
        var days = exceptions == null ? List.<CalendrierOuvreCalculator.ExceptionJour>of() : exceptions.stream().map(ex -> {
            if (ex.dateLocale() == null || ex.type() == null) throw new IllegalArgumentException("chantiers.calendrier.exception_invalide");
            return new CalendrierOuvreCalculator.ExceptionJour(ex.dateLocale(), ex.type(),
                    ex.creneaux() == null ? List.of() : ex.creneaux().stream().map(p -> p.toDomain(false)).toList());
        }).toList();
        if (days.stream().map(CalendrierOuvreCalculator.ExceptionJour::date).distinct().count() != days.size()) {
            throw new IllegalArgumentException("chantiers.calendrier.exception_dupliquee");
        }
        return new CalendrierOuvreCalculator(List.of(new CalendrierOuvreCalculator.Version(LocalDate.of(1900, 1, 1), zone, slots, days)));
    }
}
