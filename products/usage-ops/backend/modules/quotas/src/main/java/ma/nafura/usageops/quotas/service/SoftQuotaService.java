package ma.nafura.usageops.quotas.service;

import lombok.RequiredArgsConstructor;
import ma.nafura.usageops.quotas.domain.UsageSoftQuota;
import ma.nafura.usageops.quotas.repository.UsageSoftQuotaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SoftQuotaService {

    public static final String METRIC_AI_TOKENS_MONTH = "ai.tokens.month";
    public static final String METRIC_AI_COST_MONTH = "ai.cost_usd.month";
    public static final String METRIC_STORAGE_BYTES = "storage.bytes";

    private static final Set<String> ALLOWED_METRICS = Set.of(
            METRIC_AI_TOKENS_MONTH,
            METRIC_AI_COST_MONTH,
            METRIC_STORAGE_BYTES
    );

    private final UsageSoftQuotaRepository repository;

    public List<UsageSoftQuota> listAll() {
        return repository.findAll();
    }

    public List<UsageSoftQuota> listEnabled() {
        return repository.findByEnabledTrue();
    }

    @Transactional
    public UsageSoftQuota create(String tenantId, String metricKey, BigDecimal softLimit,
                                 Integer warnPercent, String productId, Boolean enabled) {
        validateMetric(metricKey);
        UsageSoftQuota quota = new UsageSoftQuota();
        quota.setTenantId(blankToNull(tenantId));
        quota.setMetricKey(metricKey);
        quota.setSoftLimit(softLimit);
        quota.setWarnPercent(warnPercent != null ? warnPercent : 80);
        quota.setProductId(blankToNull(productId));
        quota.setEnabled(enabled == null || enabled);
        return repository.save(quota);
    }

    @Transactional
    public UsageSoftQuota update(UUID id, String tenantId, String metricKey, BigDecimal softLimit,
                                 Integer warnPercent, String productId, Boolean enabled) {
        UsageSoftQuota quota = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quota not found"));
        if (metricKey != null) {
            validateMetric(metricKey);
            quota.setMetricKey(metricKey);
        }
        if (tenantId != null) {
            quota.setTenantId(blankToNull(tenantId));
        }
        if (softLimit != null) {
            quota.setSoftLimit(softLimit);
        }
        if (warnPercent != null) {
            quota.setWarnPercent(warnPercent);
        }
        if (productId != null) {
            quota.setProductId(blankToNull(productId));
        }
        if (enabled != null) {
            quota.setEnabled(enabled);
        }
        return repository.save(quota);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Quota not found");
        }
        repository.deleteById(id);
    }

    private static void validateMetric(String metricKey) {
        if (!ALLOWED_METRICS.contains(metricKey)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported metric: " + metricKey);
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
