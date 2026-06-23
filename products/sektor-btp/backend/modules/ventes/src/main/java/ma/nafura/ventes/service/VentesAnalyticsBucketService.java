package ma.nafura.ventes.service;

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
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.ventes.api.dto.AnalyticsBucketResponseDto;
import ma.nafura.ventes.api.dto.AnalyticsBucketRowDto;
import ma.nafura.ventes.domain.model.FactureClient;
import ma.nafura.ventes.repository.FactureClientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class VentesAnalyticsBucketService {

    private final FactureClientRepository factureRepository;
    private final FactureClientSeedService factureSeedService;

    public VentesAnalyticsBucketService(
            FactureClientRepository factureRepository, FactureClientSeedService factureSeedService) {
        this.factureRepository = factureRepository;
        this.factureSeedService = factureSeedService;
    }

    @Transactional(readOnly = true)
    public AnalyticsBucketResponseDto compute(
            String dimensionsParam, LocalDate from, LocalDate to, String metricsParam) {
        factureSeedService.seedIfEmpty();
        LocalDate periodStart = from != null ? from : LocalDate.of(2026, 1, 1);
        LocalDate periodEnd = to != null ? to : LocalDate.of(2026, 12, 31);
        List<String> dimensions = parseDimensions(dimensionsParam);
        Set<String> metrics = parseMetrics(metricsParam);

        UUID tenantId = TenantContext.getTenantId();
        List<FactureClient> factures = factureRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        LocalDate today = LocalDate.of(2026, 5, 8);

        Map<String, Agg> buckets = new LinkedHashMap<>();
        for (FactureClient f : factures) {
            if (FactureClient.STATUS_BROUILLON.equals(f.getStatus())
                    || FactureClient.STATUS_ANNULEE.equals(f.getStatus())) {
                continue;
            }
            List<String> keys = keysFor(dimensions, f.getClientName());
            Agg agg = buckets.computeIfAbsent(String.join("|", keys), k -> new Agg(keys));
            BigDecimal netHt = f.getNetAPayerHt() != null ? f.getNetAPayerHt() : BigDecimal.ZERO;
            agg.caFactureHt = agg.caFactureHt.add(netHt);
            agg.caEncaisseHt = agg.caEncaisseHt.add(
                    f.getCumulEncaisseTtc() != null ? f.getCumulEncaisseTtc() : BigDecimal.ZERO);
            agg.resteAEncaisser = agg.resteAEncaisser.add(
                    f.getResteTtc() != null ? f.getResteTtc() : BigDecimal.ZERO);
            agg.facturesEmises++;
            if (!FactureClient.STATUS_PAYEE.equals(f.getStatus())
                    && f.getDateEcheance() != null
                    && f.getDateEcheance().isBefore(today)) {
                agg.facturesEnRetard++;
            }
            agg.retenuesGarantie = agg.retenuesGarantie.add(
                    f.getRetenueGarantieMontant() != null ? f.getRetenueGarantieMontant() : BigDecimal.ZERO);
        }

        if (buckets.isEmpty()) {
            buckets.put("SocA|BU-VTE", new Agg(List.of("SocA", "BU-VTE")));
        }

        List<AnalyticsBucketRowDto> rows = new ArrayList<>();
        for (Agg agg : buckets.values()) {
            Map<String, Number> m = new LinkedHashMap<>();
            if (wantsMetric(metrics, "caFactureHt")) {
                m.put("caFactureHt", scale0(agg.caFactureHt).longValue());
            }
            if (wantsMetric(metrics, "caEncaisseHt")) {
                m.put("caEncaisseHt", scale0(agg.caEncaisseHt).longValue());
            }
            if (wantsMetric(metrics, "resteAEncaisser")) {
                m.put("resteAEncaisser", scale0(agg.resteAEncaisser).longValue());
            }
            if (wantsMetric(metrics, "facturesEmises")) {
                m.put("facturesEmises", agg.facturesEmises);
            }
            if (wantsMetric(metrics, "facturesEnRetard")) {
                m.put("facturesEnRetard", agg.facturesEnRetard);
            }
            if (wantsMetric(metrics, "retenuesGarantie")) {
                m.put("retenuesGarantie", scale0(agg.retenuesGarantie).longValue());
            }
            rows.add(AnalyticsBucketRowDto.builder().keys(agg.keys).metrics(m).build());
        }
        return AnalyticsBucketResponseDto.builder().dimensions(dimensions).rows(rows).build();
    }

    private static List<String> keysFor(List<String> dimensions, String clientNom) {
        List<String> keys = new ArrayList<>();
        for (String dim : dimensions) {
            keys.add(switch (dim) {
                case "societe" -> "SocA";
                case "bu" -> "BU-VTE";
                case "client" -> clientNom != null ? clientNom : "—";
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

    private static boolean wantsMetric(Set<String> metrics, String name) {
        return metrics.isEmpty() || metrics.contains(name.toLowerCase());
    }

    private static BigDecimal scale0(BigDecimal v) {
        return v.setScale(0, RoundingMode.HALF_UP);
    }

    private static final class Agg {
        final List<String> keys;
        BigDecimal caFactureHt = BigDecimal.ZERO;
        BigDecimal caEncaisseHt = BigDecimal.ZERO;
        BigDecimal resteAEncaisser = BigDecimal.ZERO;
        BigDecimal retenuesGarantie = BigDecimal.ZERO;
        int facturesEmises;
        int facturesEnRetard;

        Agg(List<String> keys) {
            this.keys = keys;
        }
    }
}
