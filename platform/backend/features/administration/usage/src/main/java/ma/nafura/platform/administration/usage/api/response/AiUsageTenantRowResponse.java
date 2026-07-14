package ma.nafura.platform.administration.usage.api.response;

import java.math.BigDecimal;

public record AiUsageTenantRowResponse(
        String tenantId,
        long requestCount,
        long tokensIn,
        long tokensOut,
        long tokensTotal,
        BigDecimal costUsd
) {
}
