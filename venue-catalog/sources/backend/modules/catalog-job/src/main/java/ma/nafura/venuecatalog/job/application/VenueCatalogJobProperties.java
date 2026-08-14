package ma.nafura.venuecatalog.job.application;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "venue-catalog.jobs")
public class VenueCatalogJobProperties {

    private int idempotencyTtlHours = 24;
    private long interRequestDelayMs = 2000;

    public int getIdempotencyTtlHours() {
        return idempotencyTtlHours;
    }

    public void setIdempotencyTtlHours(int idempotencyTtlHours) {
        this.idempotencyTtlHours = idempotencyTtlHours;
    }

    public long getInterRequestDelayMs() {
        return interRequestDelayMs;
    }

    public void setInterRequestDelayMs(long interRequestDelayMs) {
        this.interRequestDelayMs = interRequestDelayMs;
    }
}
