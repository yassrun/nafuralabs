package ma.nafura.platform.framework.scheduling;

import java.util.UUID;

/**
 * Execution context passed to scheduled jobs.
 */
public record ScheduledJobContext(
        String jobKey,
        UUID tenantId
) {
}

