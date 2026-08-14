package ma.nafura.platform.administration.usage.api.response;

import java.math.BigDecimal;
import java.time.Instant;

public record AiUsageTimeseriesPointResponse(
        Instant day,
        long requestCount,
        long tokensTotal,
        BigDecimal costUsd
) {
}
