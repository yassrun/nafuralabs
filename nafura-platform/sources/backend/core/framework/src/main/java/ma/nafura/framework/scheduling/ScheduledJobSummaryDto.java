package ma.nafura.platform.framework.scheduling;

import java.time.OffsetDateTime;
import lombok.Data;

@Data
public class ScheduledJobSummaryDto {

    private String key;
    private String description;
    private String cron;
    private boolean tenantScoped;
    private boolean enabled = true;
    private LastExecutionDto lastExecution;

    @Data
    public static class LastExecutionDto {
        private final java.util.UUID id;
        private final OffsetDateTime startedAt;
        private final ScheduledJobStatus status;
        private final Long durationMs;
    }
}

