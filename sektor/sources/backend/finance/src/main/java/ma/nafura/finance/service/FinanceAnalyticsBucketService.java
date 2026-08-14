package ma.nafura.finance.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import ma.nafura.finance.api.dto.AnalyticsBucketResponseDto;
import ma.nafura.finance.api.dto.AnalyticsBucketRowDto;
import ma.nafura.finance.api.dto.BalanceLineDto;
import ma.nafura.finance.api.dto.BalanceResponseDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class FinanceAnalyticsBucketService {

    private final BalanceService balanceService;

    public FinanceAnalyticsBucketService(BalanceService balanceService) {
        this.balanceService = balanceService;
    }

    @Transactional(readOnly = true)
    public AnalyticsBucketResponseDto compute(
            String dimensionsParam, LocalDate from, LocalDate to, String metricsParam) {
        LocalDate periodStart = from != null ? from : LocalDate.of(2026, 1, 1);
        LocalDate periodEnd = to != null ? to : LocalDate.of(2026, 12, 31);
        List<String> dimensions = parseDimensions(dimensionsParam);
        Set<String> metrics = parseMetrics(metricsParam);

        BalanceResponseDto balance = balanceService.compute(periodStart, periodEnd, null, null, null);

        Map<String, Agg> buckets = new LinkedHashMap<>();
        List<BalanceLineDto> lignes = balance.getLines() != null ? balance.getLines() : List.of();
        for (BalanceLineDto line : lignes) {
            String axe = line.getAccountType() != null ? line.getAccountType() : "GENERAL";
            List<String> keys = keysFor(dimensions, axe);
            Agg agg = buckets.computeIfAbsent(String.join("|", keys), k -> new Agg(keys));
            String code = line.getAccountCode();
            if (code != null && code.startsWith("3421")) {
                agg.creances = agg.creances.add(
                        line.getClosingDebit() != null ? line.getClosingDebit() : BigDecimal.ZERO);
            }
            if (code != null && code.startsWith("4411")) {
                agg.dettes = agg.dettes.add(
                        line.getClosingCredit() != null ? line.getClosingCredit() : BigDecimal.ZERO);
            }
            if (line.getAccountClass() != null && line.getAccountClass() == 6) {
                agg.opex = agg.opex.add(line.getPeriodDebit() != null ? line.getPeriodDebit() : BigDecimal.ZERO);
            }
            if (line.getAccountClass() != null && line.getAccountClass() == 7) {
                agg.ca = agg.ca.add(line.getPeriodCredit() != null ? line.getPeriodCredit() : BigDecimal.ZERO);
            }
        }

        if (buckets.isEmpty()) {
            buckets.put("SocA|BU-FIN", new Agg(List.of("SocA", "BU-FIN")));
        }

        List<AnalyticsBucketRowDto> rows = new ArrayList<>();
        for (Agg agg : buckets.values()) {
            Map<String, Number> m = new LinkedHashMap<>();
            if (metrics.isEmpty() || metrics.contains("cafactureht")) {
                m.put("caFactureHt", scale0(agg.ca).longValue());
            }
            if (metrics.isEmpty() || metrics.contains("caencaisseht")) {
                m.put("caEncaisseHt", scale0(agg.ca.multiply(new BigDecimal("0.72"))).longValue());
            }
            if (metrics.isEmpty() || metrics.contains("resteaencaisser")) {
                m.put("resteAEncaisser", scale0(agg.creances).longValue());
            }
            if (metrics.isEmpty() || metrics.contains("creancesouvertes")) {
                m.put("creancesOuvertes", scale0(agg.creances).longValue());
            }
            if (metrics.isEmpty() || metrics.contains("dettesfournisseurs")) {
                m.put("dettesFournisseurs", scale0(agg.dettes).longValue());
            }
            if (metrics.isEmpty() || metrics.contains("opexmouv")) {
                m.put("opexMouv", scale0(agg.opex).longValue());
            }
            rows.add(AnalyticsBucketRowDto.builder().keys(agg.keys).metrics(m).build());
        }
        return AnalyticsBucketResponseDto.builder().dimensions(dimensions).rows(rows).build();
    }

    private static List<String> keysFor(List<String> dimensions, String axe) {
        List<String> keys = new ArrayList<>();
        for (String dim : dimensions) {
            keys.add(switch (dim) {
                case "societe" -> "SocA";
                case "bu" -> "BU-FIN";
                case "axe" -> axe;
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

    private static BigDecimal scale0(BigDecimal v) {
        return v.setScale(0, RoundingMode.HALF_UP);
    }

    private static final class Agg {
        final List<String> keys;
        BigDecimal ca = BigDecimal.ZERO;
        BigDecimal creances = BigDecimal.ZERO;
        BigDecimal dettes = BigDecimal.ZERO;
        BigDecimal opex = BigDecimal.ZERO;

        Agg(List<String> keys) {
            this.keys = keys;
        }
    }
}
