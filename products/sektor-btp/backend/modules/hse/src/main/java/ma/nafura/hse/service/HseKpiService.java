package ma.nafura.hse.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.hse.api.dto.HseKpiDto;
import ma.nafura.hse.api.dto.HseKpiEvolutionMensuelleDto;
import ma.nafura.hse.api.dto.PyramideBirdDto;
import ma.nafura.hse.domain.model.Incident;
import ma.nafura.hse.repository.IncidentRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class HseKpiService {

    static final long STUB_HEURES_TRAVAILLEES = 1_000_000L;

    private final IncidentRepository incidentRepository;
    private final IncidentSeedService incidentSeedService;

    public HseKpiService(IncidentRepository incidentRepository, IncidentSeedService incidentSeedService) {
        this.incidentRepository = incidentRepository;
        this.incidentSeedService = incidentSeedService;
    }

    @Transactional(readOnly = true)
    public HseKpiDto compute(LocalDate from, LocalDate to, String chantierId) {
        incidentSeedService.seedIfEmpty();
        if (from == null || to == null) {
            throw new IllegalArgumentException("from and to are required");
        }
        if (from.isAfter(to)) {
            throw new IllegalArgumentException("from must be on or before to");
        }

        UUID tenantId = TenantContext.getTenantId();
        List<Incident> incidents = loadIncidents(tenantId, from, to, chantierId);

        long heures = STUB_HEURES_TRAVAILLEES;
        int atTotal = 0;
        int atAvecArret = 0;
        int joursArret = 0;
        int presquAccidents = 0;
        int autresIncidents = 0;

        Map<YearMonth, HseKpiEvolutionMensuelleDto> evolutionByMonth = new LinkedHashMap<>();
        YearMonth cursor = YearMonth.from(from);
        YearMonth endMonth = YearMonth.from(to);
        while (!cursor.isAfter(endMonth)) {
            evolutionByMonth.put(
                    cursor,
                    HseKpiEvolutionMensuelleDto.builder()
                            .mois(cursor.toString())
                            .at(0)
                            .atAvecArret(0)
                            .joursArret(0)
                            .build());
            cursor = cursor.plusMonths(1);
        }

        LocalDate lastAtDate = null;
        for (Incident incident : incidents) {
            String type = incident.getTypeIncident();
            if (Incident.TYPE_AT.equals(type)) {
                atTotal++;
                int arret = incident.getJoursArret() != null ? incident.getJoursArret() : 0;
                if (arret > 0) {
                    atAvecArret++;
                    joursArret += arret;
                }
                if (lastAtDate == null || incident.getDateIncident().isAfter(lastAtDate)) {
                    lastAtDate = incident.getDateIncident();
                }
                YearMonth ym = YearMonth.from(incident.getDateIncident());
                HseKpiEvolutionMensuelleDto monthly = evolutionByMonth.get(ym);
                if (monthly != null) {
                    monthly.setAt(monthly.getAt() + 1);
                    if (arret > 0) {
                        monthly.setAtAvecArret(monthly.getAtAvecArret() + 1);
                        monthly.setJoursArret(monthly.getJoursArret() + arret);
                    }
                }
            } else if (Incident.TYPE_PRESQU_ACCIDENT.equals(type)) {
                presquAccidents++;
            } else if (Incident.TYPE_INCIDENT.equals(type) || Incident.TYPE_ENVIRONNEMENT.equals(type)) {
                autresIncidents++;
            }
        }

        double tf1 = scale3(atAvecArret * 1_000_000.0 / heures);
        double tf2 = scale3(atTotal * 1_000_000.0 / heures);
        double tg = scale3(joursArret * 1_000.0 / heures);
        int joursSansAccident = computeJoursSansAccident(to, lastAtDate);

        PyramideBirdDto pyramide = PyramideBirdDto.builder()
                .incidents(autresIncidents)
                .presquAccidents(presquAccidents)
                .at(atTotal)
                .atAvecArret(atAvecArret)
                .ratioPresquAccidentParAt(ratio(presquAccidents, atTotal))
                .ratioIncidentParAt(ratio(autresIncidents, atTotal))
                .build();

        List<HseKpiEvolutionMensuelleDto> evolutionMensuelle =
                evolutionByMonth.values().stream().toList();

        return HseKpiDto.builder()
                .tf1(tf1)
                .tf2(tf2)
                .tg(tg)
                .joursSansAccident(joursSansAccident)
                .pyramideBird(pyramide)
                .evolutionMensuelle(evolutionMensuelle)
                .heuresTravaillees(heures)
                .build();
    }

    static double scale3(double value) {
        return BigDecimal.valueOf(value).setScale(3, RoundingMode.HALF_UP).doubleValue();
    }

    static double ratio(int numerator, int denominator) {
        if (denominator <= 0) {
            return 0.0;
        }
        return scale3((double) numerator / denominator);
    }

    static int computeJoursSansAccident(LocalDate to, LocalDate lastAtDate) {
        if (lastAtDate == null) {
            return (int) ChronoUnit.DAYS.between(to.withDayOfMonth(1), to);
        }
        long days = ChronoUnit.DAYS.between(lastAtDate, to);
        return (int) Math.max(0, days);
    }

    private List<Incident> loadIncidents(UUID tenantId, LocalDate from, LocalDate to, String chantierId) {
        List<Incident> rows;
        if (StringUtils.hasText(chantierId)) {
            rows = incidentRepository.findByTenantIdAndChantierIdAndDateIncidentBetweenOrderByDateIncidentAsc(
                    tenantId, chantierId.trim(), from, to);
        } else {
            rows = incidentRepository.findByTenantIdAndDateIncidentBetweenOrderByDateIncidentAsc(tenantId, from, to);
        }
        return rows.stream()
                .sorted(Comparator.comparing(Incident::getDateIncident))
                .toList();
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
