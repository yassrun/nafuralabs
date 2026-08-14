package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import ma.nafura.chantiers.api.dto.AnalyticsBucketResponseDto;
import ma.nafura.chantiers.api.dto.AnalyticsBucketRowDto;
import ma.nafura.chantiers.domain.model.Chantier;
import ma.nafura.chantiers.domain.model.SituationTravaux;
import ma.nafura.chantiers.repository.ChantierRepository;
import ma.nafura.chantiers.repository.SituationTravauxRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ChantiersAnalyticsBucketService {

    private final ChantierRepository chantierRepository;
    private final ChantierSeedService chantierSeedService;
    private final SituationTravauxRepository situationRepository;

    public ChantiersAnalyticsBucketService(
            ChantierRepository chantierRepository,
            ChantierSeedService chantierSeedService,
            SituationTravauxRepository situationRepository) {
        this.chantierRepository = chantierRepository;
        this.chantierSeedService = chantierSeedService;
        this.situationRepository = situationRepository;
    }

    @Transactional(readOnly = true)
    public AnalyticsBucketResponseDto compute(
            String dimensionsParam, LocalDate from, LocalDate to, String metricsParam) {
        chantierSeedService.seedIfEmpty();

        LocalDate periodStart = from != null ? from : LocalDate.of(2026, 1, 1);
        LocalDate periodEnd = to != null ? to : LocalDate.of(2026, 12, 31);
        if (periodStart.isAfter(periodEnd)) {
            throw new IllegalArgumentException("from must be on or before to");
        }

        List<String> dimensions = parseList(dimensionsParam, List.of("societe", "bu"));
        Set<String> metrics = parseMetrics(metricsParam);

        UUID tenantId = TenantContext.getTenantId();
        List<Chantier> chantiers = chantierRepository.findByTenantIdOrderByCodeAsc(tenantId);
        List<SituationTravaux> situations = situationRepository.findByTenantId(tenantId);

        Map<String, Agg> buckets = new LinkedHashMap<>();

        for (Chantier c : chantiers) {
            List<String> keys = keysFor(dimensions, c);
            Agg agg = buckets.computeIfAbsent(keyKey(keys), k -> new Agg(keys));
            agg.nbChantiers++;
            agg.totalBudget = agg.totalBudget.add(c.getMontantHt() != null ? c.getMontantHt() : BigDecimal.ZERO);
            if (Chantier.STATUS_EN_COURS.equals(c.getStatus())) {
                agg.chantiersEnCours++;
            }
            if (isTermine(c.getStatus())) {
                agg.chantiersTermines++;
            }
            agg.avancementSum = agg.avancementSum.add(
                    c.getAvancementPercent() != null ? c.getAvancementPercent() : BigDecimal.ZERO);
        }

        for (SituationTravaux s : situations) {
            if (s.getDateEmission() == null
                    || s.getDateEmission().isBefore(periodStart)
                    || s.getDateEmission().isAfter(periodEnd)) {
                continue;
            }
            if (SituationTravaux.STATUS_BROUILLON.equals(s.getStatus())) {
                continue;
            }
            Chantier chantier = chantiers.stream()
                    .filter(c -> c.getId().equals(s.getChantierId()))
                    .findFirst()
                    .orElse(null);
            List<String> keys = keysFor(dimensions, chantier);
            buckets.computeIfAbsent(keyKey(keys), k -> new Agg(keys)).situationsEmises++;
            buckets.computeIfAbsent(keyKey(keys), k -> new Agg(keys))
                    .ca = buckets.get(keyKey(keys)).ca.add(
                            s.getNetAPayerHt() != null ? s.getNetAPayerHt() : BigDecimal.ZERO);
        }

        if (buckets.isEmpty()) {
            buckets.put(keyKey(keysFor(dimensions, null)), new Agg(keysFor(dimensions, null)));
        }

        List<AnalyticsBucketRowDto> rows = new ArrayList<>();
        for (Agg agg : buckets.values()) {
            Map<String, Number> metricValues = new LinkedHashMap<>();
            if (metrics.isEmpty() || metrics.contains("ca")) {
                metricValues.put("ca", scale0(agg.ca).longValue());
            }
            if (metrics.isEmpty() || metrics.contains("nbchantiers")) {
                metricValues.put("nbChantiers", agg.nbChantiers);
            }
            if (metrics.isEmpty() || metrics.contains("totalbudget")) {
                metricValues.put("totalBudget", scale0(agg.totalBudget).longValue());
            }
            if (metrics.isEmpty() || metrics.contains("chantiersencours")) {
                metricValues.put("chantiersEnCours", agg.chantiersEnCours);
            }
            if (metrics.isEmpty() || metrics.contains("chantierstermines")) {
                metricValues.put("chantiersTermines", agg.chantiersTermines);
            }
            if (metrics.isEmpty() || metrics.contains("situationsemises")) {
                metricValues.put("situationsEmises", agg.situationsEmises);
            }
            if (metrics.isEmpty() || metrics.contains("avancementmoyen")) {
                int avg = agg.nbChantiers > 0
                        ? agg.avancementSum
                                .divide(BigDecimal.valueOf(agg.nbChantiers), 0, RoundingMode.HALF_UP)
                                .intValue()
                        : 0;
                metricValues.put("avancementMoyen", avg);
            }
            rows.add(AnalyticsBucketRowDto.of(agg.keys, metricValues));
        }

        return AnalyticsBucketResponseDto.of(dimensions, rows);
    }

    private static List<String> keysFor(List<String> dimensions, Chantier c) {
        List<String> keys = new ArrayList<>();
        for (String dim : dimensions) {
            keys.add(switch (dim) {
                case "societe" -> societeFor(c);
                case "bu" -> buFor(c);
                case "client" -> c != null && c.getClientName() != null ? c.getClientName() : "—";
                default -> "—";
            });
        }
        return keys;
    }

    private static String societeFor(Chantier c) {
        if (c == null) {
            return "SocA";
        }
        if (StringUtils.hasText(c.getSocieteId())) {
            return c.getSocieteId();
        }
        return switch (c.getId()) {
            case "ch-001", "ch-003", "ch-005" -> "SocA";
            case "ch-002", "ch-004" -> "SocB";
            default -> "SocA";
        };
    }

    private static String buFor(Chantier c) {
        if (c == null || !StringUtils.hasText(c.getChantierType())) {
            return "BU-GEN";
        }
        return switch (c.getChantierType()) {
            case "TP" -> "BU-INFRA";
            case "BATIMENT" -> "BU-BAT";
            default -> "BU-" + c.getChantierType();
        };
    }

    private static boolean isTermine(String status) {
        return Chantier.STATUS_RECEPTION_PROVISOIRE.equals(status)
                || Chantier.STATUS_RECEPTION_DEFINITIF.equals(status)
                || Chantier.STATUS_CLOS.equals(status);
    }

    private static List<String> parseList(String raw, List<String> defaults) {
        if (!StringUtils.hasText(raw)) {
            return defaults;
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .map(String::toLowerCase)
                .collect(Collectors.toList());
    }

    private static Set<String> parseMetrics(String raw) {
        if (!StringUtils.hasText(raw)) {
            return Set.of();
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
    }

    private static String keyKey(List<String> keys) {
        return String.join("|", keys);
    }

    private static BigDecimal scale0(BigDecimal v) {
        return v.setScale(0, RoundingMode.HALF_UP);
    }

    private static final class Agg {
        final List<String> keys;
        BigDecimal ca = BigDecimal.ZERO;
        BigDecimal totalBudget = BigDecimal.ZERO;
        BigDecimal avancementSum = BigDecimal.ZERO;
        int nbChantiers;
        int chantiersEnCours;
        int chantiersTermines;
        int situationsEmises;

        Agg(List<String> keys) {
            this.keys = keys;
        }
    }
}
