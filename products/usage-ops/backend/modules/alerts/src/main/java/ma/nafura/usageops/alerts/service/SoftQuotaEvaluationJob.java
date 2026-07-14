package ma.nafura.usageops.alerts.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.collaboration.notification.service.EmailService;
import ma.nafura.usageops.alerts.domain.UsageAlertEvent;
import ma.nafura.usageops.federation.config.UsageOpsProperties;
import ma.nafura.usageops.federation.service.UsageFederationService;
import ma.nafura.usageops.federation.service.UsageFederationService.FleetTenantUsage;
import ma.nafura.usageops.federation.service.UsageFederationService.ProductBreakdown;
import ma.nafura.usageops.quotas.domain.UsageSoftQuota;
import ma.nafura.usageops.quotas.service.SoftQuotaService;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class SoftQuotaEvaluationJob {

    private final SoftQuotaService softQuotaService;
    private final UsageFederationService usageFederationService;
    private final UsageAlertService usageAlertService;
    private final UsageOpsProperties properties;
    private final ObjectProvider<EmailService> emailServiceProvider;

    /**
     * Hourly evaluation. Uses empty authorization — product APIs require super-admin JWT.
     * When called from HTTP with a bearer token, prefer {@link #evaluate(String)}.
     */
    @Scheduled(cron = "${usage-ops.alert.cron:0 0 * * * *}")
    public void scheduledEvaluate() {
        log.debug("Soft quota scheduled evaluation skipped without bearer token (use POST /api/v1/ops/alerts/evaluate)");
    }

    public int evaluate(String authorizationHeader) {
        YearMonth month = YearMonth.now(ZoneOffset.UTC);
        Instant from = month.atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant to = Instant.now();
        String windowKey = month.toString();

        List<FleetTenantUsage> fleet = usageFederationService.overview(from, to, null, authorizationHeader);
        List<UsageSoftQuota> quotas = softQuotaService.listEnabled();
        int fired = 0;

        for (UsageSoftQuota quota : quotas) {
            for (FleetTenantUsage tenant : fleet) {
                if (quota.getTenantId() != null && !quota.getTenantId().equals(tenant.tenantId())) {
                    continue;
                }
                BigDecimal used = resolveUsed(quota, tenant);
                if (used == null || quota.getSoftLimit() == null
                        || quota.getSoftLimit().compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }
                BigDecimal ratio = used.divide(quota.getSoftLimit(), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100));
                int warnPercent = quota.getWarnPercent() != null ? quota.getWarnPercent() : 80;
                String severity = null;
                if (ratio.compareTo(BigDecimal.valueOf(100)) >= 0) {
                    severity = "BREACH";
                } else if (ratio.compareTo(BigDecimal.valueOf(warnPercent)) >= 0) {
                    severity = "WARN";
                }
                if (severity == null) {
                    continue;
                }

                String alertKey = buildAlertKey(quota, tenant.tenantId(), severity, windowKey);
                if (usageAlertService.alreadyFired(alertKey, windowKey)) {
                    continue;
                }

                UsageAlertEvent event = new UsageAlertEvent();
                event.setAlertKey(alertKey);
                event.setTenantId(tenant.tenantId());
                event.setMetricKey(quota.getMetricKey());
                event.setProductId(quota.getProductId());
                event.setUsedValue(used);
                event.setLimitValue(quota.getSoftLimit());
                event.setSeverity(severity);
                event.setWindowKey(windowKey);
                usageAlertService.save(event);
                notifyOps(event, tenant);
                fired++;
            }
        }
        log.info("Soft quota evaluation fired {} alerts for window {}", fired, windowKey);
        return fired;
    }

    private BigDecimal resolveUsed(UsageSoftQuota quota, FleetTenantUsage tenant) {
        if (quota.getProductId() != null && !quota.getProductId().isBlank()) {
            ProductBreakdown product = tenant.products().stream()
                    .filter(p -> quota.getProductId().equals(p.productId()))
                    .findFirst()
                    .orElse(null);
            if (product == null) {
                return BigDecimal.ZERO;
            }
            return switch (quota.getMetricKey()) {
                case SoftQuotaService.METRIC_AI_TOKENS_MONTH -> BigDecimal.valueOf(product.tokensTotal());
                case SoftQuotaService.METRIC_AI_COST_MONTH -> product.costUsd();
                case SoftQuotaService.METRIC_STORAGE_BYTES -> BigDecimal.valueOf(product.storageBytes());
                default -> null;
            };
        }
        return switch (quota.getMetricKey()) {
            case SoftQuotaService.METRIC_AI_TOKENS_MONTH -> BigDecimal.valueOf(tenant.tokensTotal());
            case SoftQuotaService.METRIC_AI_COST_MONTH -> tenant.costUsd();
            case SoftQuotaService.METRIC_STORAGE_BYTES -> BigDecimal.valueOf(tenant.storageBytes());
            default -> null;
        };
    }

    private void notifyOps(UsageAlertEvent event, FleetTenantUsage tenant) {
        EmailService emailService = emailServiceProvider.getIfAvailable();
        if (emailService == null) {
            return;
        }
        String recipients = properties.getAlert().getRecipients();
        if (recipients == null || recipients.isBlank()) {
            return;
        }
        String subject = "[usage-ops] " + event.getSeverity() + " " + event.getMetricKey()
                + " tenant=" + (tenant.name() != null ? tenant.name() : event.getTenantId());
        String body = "Alert: " + event.getAlertKey()
                + "\nSeverity: " + event.getSeverity()
                + "\nTenant: " + event.getTenantId()
                + "\nMetric: " + event.getMetricKey()
                + "\nUsed: " + event.getUsedValue()
                + "\nLimit: " + event.getLimitValue()
                + "\nWindow: " + event.getWindowKey();
        String html = "<pre>" + body + "</pre>";
        Arrays.stream(recipients.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .forEach(to -> {
                    try {
                        emailService.sendEmail(to, subject, html, body);
                    } catch (Exception ex) {
                        log.warn("Failed to send usage alert email to {}: {}", to, ex.getMessage());
                    }
                });
    }

    private static String buildAlertKey(UsageSoftQuota quota, String tenantId, String severity, String windowKey) {
        return "usage:"
                + (quota.getProductId() != null ? quota.getProductId() : "all")
                + ":tenant:" + tenantId
                + ":" + quota.getMetricKey()
                + ":" + severity
                + ":" + windowKey;
    }
}
