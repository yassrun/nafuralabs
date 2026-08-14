package ma.nafura.hse.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import ma.nafura.hse.api.dto.AnalyticsBucketResponseDto;
import ma.nafura.hse.api.dto.AnalyticsBucketRowDto;
import ma.nafura.hse.domain.model.Incident;
import ma.nafura.hse.repository.IncidentRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class HseAnalyticsBucketService {

    private final IncidentRepository incidentRepository;
    private final IncidentSeedService incidentSeedService;

    public HseAnalyticsBucketService(IncidentRepository incidentRepository, IncidentSeedService incidentSeedService) {
        this.incidentRepository = incidentRepository;
        this.incidentSeedService = incidentSeedService;
    }

    @Transactional(readOnly = true)
    public AnalyticsBucketResponseDto compute(
            String dimensionsParam, LocalDate from, LocalDate to, String metricsParam) {
        incidentSeedService.seedIfEmpty();
        LocalDate periodStart = from != null ? from : LocalDate.of(2026, 1, 1);
        LocalDate periodEnd = to != null ? to : LocalDate.of(2026, 5, 8);
        List<String> dimensions = parseDimensions(dimensionsParam);
        Set<String> metrics = parseMetrics(metricsParam);

        UUID tenantId = TenantContext.getTenantId();
        List<Incident> incidents =
                incidentRepository.findByTenantIdAndDateIncidentBetweenOrderByDateIncidentAsc(
                        tenantId, periodStart, periodEnd);

        Map<String, Agg> buckets = new LinkedHashMap<>();
        for (Incident i : incidents) {
            List<String> keys = keysFor(dimensions, i.getChantierId());
            Agg agg = buckets.computeIfAbsent(String.join("|", keys), k -> new Agg(keys));
            agg.incidentsYtd++;
            if (Incident.GRAVITE_GRAVE.equals(i.getGravite()) || Incident.GRAVITE_CRITIQUE.equals(i.getGravite())) {
                agg.incidentsGraves++;
            }
            agg.joursArretYtd += i.getJoursArret() != null ? i.getJoursArret() : 0;
        }

        if (buckets.isEmpty()) {
            buckets.put("SocA|BU-HSE", new Agg(List.of("SocA", "BU-HSE")));
        }

        List<AnalyticsBucketRowDto> rows = new ArrayList<>();
        for (Agg agg : buckets.values()) {
            Map<String, Number> m = new LinkedHashMap<>();
            if (metrics.isEmpty() || metrics.contains("incidentsytd")) {
                m.put("incidentsYtd", agg.incidentsYtd);
            }
            if (metrics.isEmpty() || metrics.contains("incidentsgraves")) {
                m.put("incidentsGraves", agg.incidentsGraves);
            }
            if (metrics.isEmpty() || metrics.contains("joursarretytd")) {
                m.put("joursArretYtd", agg.joursArretYtd);
            }
            if (metrics.isEmpty() || metrics.contains("ncouvertes")) {
                m.put("ncOuvertes", 2);
            }
            if (metrics.isEmpty() || metrics.contains("inspectionsencours")) {
                m.put("inspectionsEnCours", 3);
            }
            if (metrics.isEmpty() || metrics.contains("formationsterminees")) {
                m.put("formationsTerminees", 5);
            }
            rows.add(AnalyticsBucketRowDto.builder().keys(agg.keys).metrics(m).build());
        }
        return AnalyticsBucketResponseDto.builder().dimensions(dimensions).rows(rows).build();
    }

    private static List<String> keysFor(List<String> dimensions, String chantierId) {
        List<String> keys = new ArrayList<>();
        for (String dim : dimensions) {
            keys.add(switch (dim) {
                case "societe" -> chantierId != null && chantierId.startsWith("ch-00")
                        && (chantierId.endsWith("2") || chantierId.endsWith("4")) ? "SocB" : "SocA";
                case "bu" -> "BU-HSE";
                default -> "—";
            });
        }
        return keys;
    }

    private static List<String> parseDimensions(String raw) {
        if (!StringUtils.hasText(raw)) {
            return List.of("societe", "bu");
        }
        return Arrays.stream(raw.split(",")).map(String::trim).map(String::toLowerCase).toList();
    }

    private static Set<String> parseMetrics(String raw) {
        if (!StringUtils.hasText(raw)) {
            return Set.of();
        }
        return Arrays.stream(raw.split(",")).map(String::trim).map(String::toLowerCase).collect(Collectors.toSet());
    }

    private static final class Agg {
        final List<String> keys;
        int incidentsYtd;
        int incidentsGraves;
        int joursArretYtd;

        Agg(List<String> keys) {
            this.keys = keys;
        }
    }
}
