package ma.nafura.platform.administration.usage.service;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.administration.usage.api.response.AiUsageFeatureRowResponse;
import ma.nafura.platform.administration.usage.api.response.AiUsageSummaryResponse;
import ma.nafura.platform.administration.usage.api.response.AiUsageTenantRowResponse;
import ma.nafura.platform.administration.usage.api.response.AiUsageTimeseriesPointResponse;
import ma.nafura.platform.ai.llm.repository.AiUsageEventRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AiUsageQueryService {

    /** Far-future upper bound so optional {@code to} stays open-ended without null Instant binds. */
    private static final Instant OPEN_END = Instant.parse("9999-12-31T23:59:59Z");

    private final AiUsageEventRepository aiUsageEventRepository;

    public AiUsageSummaryResponse summary(String tenantId, Instant from, Instant to) {
        Instant fromBound = boundFrom(from);
        Instant toBound = boundTo(to);
        Object[] row = unwrap(aiUsageEventRepository.aggregateUsage(tenantId, fromBound, toBound));
        return new AiUsageSummaryResponse(
                toLong(row, 0),
                toLong(row, 1),
                toLong(row, 2),
                toLong(row, 3),
                toBigDecimal(row, 4),
                from,
                to
        );
    }

    public List<AiUsageTenantRowResponse> byTenant(Instant from, Instant to) {
        List<AiUsageTenantRowResponse> result = new ArrayList<>();
        for (Object[] row : aiUsageEventRepository.aggregateUsageByTenant(boundFrom(from), boundTo(to))) {
            result.add(new AiUsageTenantRowResponse(
                    row[0] != null ? row[0].toString() : null,
                    toLong(row, 1),
                    toLong(row, 2),
                    toLong(row, 3),
                    toLong(row, 4),
                    toBigDecimal(row, 5)
            ));
        }
        return result;
    }

    public List<AiUsageTimeseriesPointResponse> timeseries(String tenantId, Instant from, Instant to) {
        List<AiUsageTimeseriesPointResponse> result = new ArrayList<>();
        for (Object[] row : aiUsageEventRepository.aggregateUsageTimeseries(tenantId, boundFrom(from), boundTo(to))) {
            result.add(new AiUsageTimeseriesPointResponse(
                    toInstant(row[0]),
                    toLong(row, 1),
                    toLong(row, 2),
                    toBigDecimal(row, 3)
            ));
        }
        return result;
    }

    public List<AiUsageFeatureRowResponse> byFeature(String tenantId, Instant from, Instant to) {
        List<AiUsageFeatureRowResponse> result = new ArrayList<>();
        for (Object[] row : aiUsageEventRepository.aggregateUsageByFeature(tenantId, boundFrom(from), boundTo(to))) {
            result.add(new AiUsageFeatureRowResponse(
                    row[0] != null ? row[0].toString() : null,
                    row[1] != null ? row[1].toString() : null,
                    toLong(row, 2),
                    toLong(row, 3),
                    toBigDecimal(row, 4)
            ));
        }
        return result;
    }

    private static Instant boundFrom(Instant from) {
        return from != null ? from : Instant.EPOCH;
    }

    private static Instant boundTo(Instant to) {
        return to != null ? to : OPEN_END;
    }

    private static Object[] unwrap(Object raw) {
        if (raw == null) {
            return new Object[]{0L, 0L, 0L, 0L, BigDecimal.ZERO};
        }
        if (raw instanceof Object[] arr) {
            if (arr.length == 1 && arr[0] instanceof Object[] nested) {
                return nested;
            }
            return arr;
        }
        return new Object[]{0L, 0L, 0L, 0L, BigDecimal.ZERO};
    }

    private static long toLong(Object[] row, int index) {
        if (row == null || index >= row.length || row[index] == null) {
            return 0L;
        }
        if (row[index] instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(row[index].toString());
    }

    private static BigDecimal toBigDecimal(Object[] row, int index) {
        if (row == null || index >= row.length || row[index] == null) {
            return BigDecimal.ZERO;
        }
        if (row[index] instanceof BigDecimal bd) {
            return bd;
        }
        if (row[index] instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        return new BigDecimal(row[index].toString());
    }

    private static Instant toInstant(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Instant instant) {
            return instant;
        }
        if (value instanceof Timestamp timestamp) {
            return timestamp.toInstant();
        }
        if (value instanceof OffsetDateTime odt) {
            return odt.toInstant();
        }
        if (value instanceof LocalDateTime ldt) {
            return ldt.toInstant(ZoneOffset.UTC);
        }
        if (value instanceof java.util.Date date) {
            return date.toInstant();
        }
        return Instant.parse(value.toString());
    }
}
