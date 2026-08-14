package ma.nafura.platform.administration.usage.api.response;

import java.math.BigDecimal;

public record AiUsageFeatureRowResponse(
        String applicationId,
        String featureKey,
        long requestCount,
        long tokensTotal,
        BigDecimal costUsd
) {
}
