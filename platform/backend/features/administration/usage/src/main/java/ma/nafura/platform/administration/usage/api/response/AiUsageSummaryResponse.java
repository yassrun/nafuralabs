package ma.nafura.platform.administration.usage.api.response;

import java.math.BigDecimal;
import java.time.Instant;

public record AiUsageSummaryResponse(
        long requestCount,
        long tokensIn,
        long tokensOut,
        long tokensTotal,
        BigDecimal costUsd,
        Instant from,
        Instant to
) {
}
