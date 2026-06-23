package ma.nafura.platform.framework.scheduling;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.HashMap;
import java.util.Map;

@Data
@ConfigurationProperties(prefix = "nafura.scheduling")
public class ScheduledJobProperties {

    /**
     * Master switch for scheduling.
     */
    private boolean enabled = true;

    /**
     * Thread pool size for scheduler.
     */
    private int poolSize = 4;

    /**
     * Per-job overrides keyed by job key.
     */
    private Map<String, JobProperties> jobs = new HashMap<>();

    @Data
    public static class JobProperties {
        /**
         * Whether this job is enabled.
         */
        private boolean enabled = true;

        /**
         * Override cron expression; when empty, job's default cron is used.
         */
        private String cron;
    }
}

