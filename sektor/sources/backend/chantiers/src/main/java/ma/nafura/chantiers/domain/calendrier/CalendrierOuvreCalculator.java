package ma.nafura.chantiers.domain.calendrier;

import java.time.DateTimeException;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Calcul ouvré (A05 provisoire) : minutes réelles dans le fuseau IANA, résultat en date locale.
 * Un calendrier chantier (A04 provisoire), pas par activité.
 */
public final class CalendrierOuvreCalculator {

    public static final String FUSEAU_DEFAUT = "Africa/Casablanca";
    public static final LocalTime JOURNEE_DEBUT = LocalTime.of(8, 0);
    public static final LocalTime JOURNEE_FIN = LocalTime.of(16, 0);
    static final int HORIZON_JOURS = 366 * 3;

    public static final String ERR_FUSEAU = "chantiers.calendrier.fuseau_invalide";
    public static final String ERR_CRENEAU_NUL = "chantiers.calendrier.creneau_duree_nulle";
    public static final String ERR_CHEVAUCHEMENT = "chantiers.calendrier.creneaux_chevauchants";
    public static final String ERR_SANS_PLAGE = "chantiers.calendrier.sans_plage_ouvree";
    public static final String ERR_JOUR_SEMAINE = "chantiers.calendrier.jour_semaine_invalide";
    public static final String ERR_OUVERTURE_SANS_CRENEAU = "chantiers.calendrier.ouverture_sans_creneau";
    public static final String ERR_FERMETURE_AVEC_CRENEAU = "chantiers.calendrier.fermeture_avec_creneau";

    private final List<Version> versions;

    public CalendrierOuvreCalculator(List<Version> versions) {
        if (versions == null || versions.isEmpty()) {
            throw new IllegalArgumentException(ERR_SANS_PLAGE);
        }
        this.versions = versions.stream()
                .sorted(Comparator.comparing(Version::dateEffet))
                .toList();
        for (Version v : this.versions) {
            validerVersion(v);
        }
    }

    public static ZoneId zoneOrThrow(String fuseauIana) {
        if (fuseauIana == null || fuseauIana.isBlank()) {
            throw new IllegalArgumentException(ERR_FUSEAU);
        }
        String trimmed = fuseauIana.trim();
        try {
            ZoneId zone = ZoneId.of(trimmed);
            if (zone instanceof java.time.ZoneOffset
                    || trimmed.regionMatches(true, 0, "UTC+", 0, 4)
                    || trimmed.regionMatches(true, 0, "UTC-", 0, 4)
                    || trimmed.regionMatches(true, 0, "GMT+", 0, 4)
                    || trimmed.regionMatches(true, 0, "GMT-", 0, 4)) {
                throw new IllegalArgumentException(ERR_FUSEAU + ": " + trimmed);
            }
            return zone;
        } catch (DateTimeException ex) {
            throw new IllegalArgumentException(ERR_FUSEAU + ": " + trimmed);
        }
    }

    public static List<Creneau> semaineStandardLundiVendredi() {
        List<Creneau> slots = new ArrayList<>();
        for (int jour = 1; jour <= 5; jour++) {
            slots.add(new Creneau(jour, JOURNEE_DEBUT, JOURNEE_FIN, false));
        }
        return List.copyOf(slots);
    }

    public static List<Creneau> semaineHistoriqueSeptJours() {
        List<Creneau> slots = new ArrayList<>();
        for (int jour = 1; jour <= 7; jour++) {
            slots.add(new Creneau(jour, JOURNEE_DEBUT, JOURNEE_FIN, false));
        }
        return List.copyOf(slots);
    }

    public static CalendrierOuvreCalculator standard(String fuseauIana) {
        ZoneId zone = zoneOrThrow(fuseauIana);
        return new CalendrierOuvreCalculator(List.of(new Version(
                LocalDate.of(1900, 1, 1), zone, semaineStandardLundiVendredi(), List.of())));
    }

    public static CalendrierOuvreCalculator historique(String fuseauIana) {
        ZoneId zone = zoneOrThrow(fuseauIana);
        return new CalendrierOuvreCalculator(List.of(new Version(
                LocalDate.of(1900, 1, 1), zone, semaineHistoriqueSeptJours(), List.of())));
    }

    /**
     * Date de fin <em>visible</em> (fin incluse) : dernier jour local qui consomme
     * au moins une minute ouvrée de la durée.
     */
    public LocalDate deriveInclusiveFin(LocalDate debut, int dureeMinutes) {
        if (debut == null) {
            throw new IllegalArgumentException("chantiers.activite.dates_invalides");
        }
        if (dureeMinutes <= 0) {
            return debut;
        }
        int remaining = dureeMinutes;
        LocalDate last = debut;
        LocalDate day = debut;
        LocalDate limite = debut.plusDays(HORIZON_JOURS);
        while (remaining > 0) {
            if (day.isAfter(limite)) {
                throw new IllegalArgumentException(ERR_SANS_PLAGE);
            }
            long available = minutesOuvrees(day);
            if (available > 0) {
                last = day;
                if (remaining <= available) {
                    remaining = 0;
                } else {
                    remaining -= (int) available;
                }
            }
            day = day.plusDays(1);
        }
        return last;
    }

    public long minutesOuvrees(LocalDate jourLocal) {
        Version version = versionAu(jourLocal);
        Map<LocalDate, ExceptionJour> exceptions = indexExceptions(version);
        return portionsDuJour(jourLocal, version, exceptions).stream()
                .mapToLong(p -> p.minutes())
                .sum();
    }

    public static void validerVersion(Version version) {
        Objects.requireNonNull(version.zone(), ERR_FUSEAU);
        if (version.creneaux() == null || version.creneaux().isEmpty()) {
            throw new IllegalArgumentException(ERR_SANS_PLAGE);
        }
        for (Creneau c : version.creneaux()) {
            validerCreneau(c, version.zone());
        }
        assertNonChevauchement(version.creneaux(), version.zone());
        if (version.exceptions() != null) {
            for (ExceptionJour ex : version.exceptions()) {
                if (ex.type() == CalendrierExceptionType.OUVERTURE) {
                    if (ex.ouverture() == null || ex.ouverture().isEmpty()) {
                        throw new IllegalArgumentException(ERR_OUVERTURE_SANS_CRENEAU);
                    }
                    for (Creneau c : ex.ouverture()) {
                        validerCreneau(new Creneau(1, c.debut(), c.fin(), c.lendemain()), version.zone());
                    }
                    assertNonChevauchement(
                            ex.ouverture().stream()
                                    .map(c -> new Creneau(1, c.debut(), c.fin(), c.lendemain()))
                                    .toList(),
                            version.zone());
                } else if (ex.type() == CalendrierExceptionType.FERMETURE
                        && ex.ouverture() != null
                        && !ex.ouverture().isEmpty()) {
                    throw new IllegalArgumentException(ERR_FERMETURE_AVEC_CRENEAU);
                }
            }
        }
    }

    static void validerCreneau(Creneau c, ZoneId zone) {
        if (c.jourSemaine() < 1 || c.jourSemaine() > 7) {
            throw new IllegalArgumentException(ERR_JOUR_SEMAINE + ": " + c.jourSemaine());
        }
        if (c.debut() == null || c.fin() == null) {
            throw new IllegalArgumentException(ERR_CRENEAU_NUL);
        }
        if (!c.lendemain() && !c.fin().isAfter(c.debut())) {
            throw new IllegalArgumentException(ERR_CRENEAU_NUL);
        }
        if (c.lendemain() && c.fin().equals(c.debut()) && c.debut().equals(LocalTime.MIDNIGHT)) {
            throw new IllegalArgumentException(ERR_CRENEAU_NUL);
        }
        LocalDate lundi = LocalDate.of(2026, 1, 5);
        LocalDate d = lundi.plusDays(c.jourSemaine() - 1L);
        ZonedDateTime a = ZonedDateTime.of(d, c.debut(), zone);
        ZonedDateTime b = c.lendemain()
                ? ZonedDateTime.of(d.plusDays(1), c.fin(), zone)
                : ZonedDateTime.of(d, c.fin(), zone);
        if (!b.isAfter(a) || Duration.between(a, b).isZero()) {
            throw new IllegalArgumentException(ERR_CRENEAU_NUL);
        }
    }

    static void assertNonChevauchement(List<Creneau> creneaux, ZoneId zone) {
        LocalDate lundi = LocalDate.of(2026, 1, 5);
        List<long[]> intervals = new ArrayList<>();
        for (Creneau c : creneaux) {
            LocalDate d = lundi.plusDays(c.jourSemaine() - 1L);
            long start = ZonedDateTime.of(d, c.debut(), zone).toInstant().toEpochMilli();
            ZonedDateTime end = c.lendemain()
                    ? ZonedDateTime.of(d.plusDays(1), c.fin(), zone)
                    : ZonedDateTime.of(d, c.fin(), zone);
            intervals.add(new long[] {start, end.toInstant().toEpochMilli()});
        }
        intervals.sort(Comparator.comparingLong(a -> a[0]));
        for (int i = 1; i < intervals.size(); i++) {
            if (intervals.get(i)[0] < intervals.get(i - 1)[1]) {
                throw new IllegalArgumentException(ERR_CHEVAUCHEMENT);
            }
        }
    }

    private Version versionAu(LocalDate jour) {
        Version chosen = versions.get(0);
        for (Version v : versions) {
            if (!v.dateEffet().isAfter(jour)) {
                chosen = v;
            }
        }
        return chosen;
    }

    private static Map<LocalDate, ExceptionJour> indexExceptions(Version version) {
        Map<LocalDate, ExceptionJour> map = new HashMap<>();
        if (version.exceptions() != null) {
            for (ExceptionJour ex : version.exceptions()) {
                map.put(ex.date(), ex);
            }
        }
        return map;
    }

    private List<Portion> portionsDuJour(
            LocalDate jour, Version version, Map<LocalDate, ExceptionJour> exceptions) {
        ExceptionJour duJour = exceptions.get(jour);
        if (duJour != null && duJour.type() == CalendrierExceptionType.FERMETURE) {
            return List.of();
        }
        List<Creneau> startsToday;
        if (duJour != null && duJour.type() == CalendrierExceptionType.OUVERTURE) {
            startsToday = duJour.ouverture();
        } else {
            int iso = jour.getDayOfWeek().getValue();
            startsToday = version.creneaux().stream()
                    .filter(c -> c.jourSemaine() == iso)
                    .toList();
        }
        List<Portion> portions = new ArrayList<>();
        for (Creneau c : startsToday) {
            Portion onDay = portionLocale(jour, c, version.zone(), jour);
            if (onDay.minutes() > 0) {
                portions.add(onDay);
            }
        }
        LocalDate veille = jour.minusDays(1);
        Version versionVeille = versionAu(veille);
        ExceptionJour deLaVeille = indexExceptions(versionVeille).get(veille);
        int isoVeille = veille.getDayOfWeek().getValue();
        List<Creneau> overnight;
        if (deLaVeille != null && deLaVeille.type() == CalendrierExceptionType.OUVERTURE) {
            overnight = deLaVeille.ouverture().stream().filter(Creneau::lendemain).toList();
        } else {
            overnight = versionVeille.creneaux().stream()
                    .filter(c -> c.jourSemaine() == isoVeille && c.lendemain())
                    .toList();
        }
        ZoneId zoneVeille = versionVeille.zone();
        for (Creneau c : overnight) {
            Portion onDay = portionLocale(veille, c, zoneVeille, jour);
            if (onDay.minutes() > 0) {
                portions.add(onDay);
            }
        }
        return portions;
    }

    private static Portion portionLocale(LocalDate jourDebutCreneau, Creneau c, ZoneId zone, LocalDate jourCible) {
        ZonedDateTime start = ZonedDateTime.of(jourDebutCreneau, c.debut(), zone);
        ZonedDateTime end = c.lendemain()
                ? ZonedDateTime.of(jourDebutCreneau.plusDays(1), c.fin(), zone)
                : ZonedDateTime.of(jourDebutCreneau, c.fin(), zone);
        ZonedDateTime windowStart = jourCible.atStartOfDay(zone);
        ZonedDateTime windowEnd = jourCible.plusDays(1).atStartOfDay(zone);
        ZonedDateTime a = start.isAfter(windowStart) ? start : windowStart;
        ZonedDateTime b = end.isBefore(windowEnd) ? end : windowEnd;
        if (!b.isAfter(a)) {
            return new Portion(0);
        }
        return new Portion(Duration.between(a, b).toMinutes());
    }

    public record Creneau(int jourSemaine, LocalTime debut, LocalTime fin, boolean lendemain) {
        public static Creneau of(int jour, LocalTime debut, LocalTime fin) {
            return new Creneau(jour, debut, fin, false);
        }

        public static Creneau nuit(int jour, LocalTime debut, LocalTime fin) {
            return new Creneau(jour, debut, fin, true);
        }
    }

    public record ExceptionJour(LocalDate date, CalendrierExceptionType type, List<Creneau> ouverture) {
        public static ExceptionJour fermeture(LocalDate date) {
            return new ExceptionJour(date, CalendrierExceptionType.FERMETURE, List.of());
        }

        public static ExceptionJour ouverture(LocalDate date, List<Creneau> creneaux) {
            return new ExceptionJour(date, CalendrierExceptionType.OUVERTURE, creneaux);
        }
    }

    public record Version(LocalDate dateEffet, ZoneId zone, List<Creneau> creneaux, List<ExceptionJour> exceptions) {}

    private record Portion(long minutes) {}
}
