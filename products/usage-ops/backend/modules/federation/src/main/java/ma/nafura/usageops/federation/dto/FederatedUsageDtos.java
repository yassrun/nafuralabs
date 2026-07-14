package ma.nafura.usageops.federation.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public final class FederatedUsageDtos {

    private FederatedUsageDtos() {
    }

    public record TenantInfo(
            UUID id,
            String key,
            String name,
            String applicationId,
            String productId
    ) {
    }

    public record AiSummary(
            long requestCount,
            long tokensIn,
            long tokensOut,
            long tokensTotal,
            BigDecimal costUsd,
            Instant from,
            Instant to
    ) {
    }

    public record AiTenantRow(
            String tenantId,
            long requestCount,
            long tokensIn,
            long tokensOut,
            long tokensTotal,
            BigDecimal costUsd
    ) {
    }

    public record AiTimeseriesPoint(
            Instant day,
            long requestCount,
            long tokensTotal,
            BigDecimal costUsd
    ) {
    }

    public record AiFeatureRow(
            String applicationId,
            String featureKey,
            long requestCount,
            long tokensTotal,
            BigDecimal costUsd
    ) {
    }

    public record StorageSummary(
            long documentsBytes,
            long attachmentsBytes,
            long totalBytes
    ) {
    }

    public record StorageTenantRow(
            String tenantId,
            long documentsBytes,
            long attachmentsBytes,
            long totalBytes
    ) {
    }
}
