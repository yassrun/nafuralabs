package ma.nafura.platform.framework.scheduling.jobs;

import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.framework.scheduling.ScheduledJob;
import ma.nafura.platform.framework.scheduling.ScheduledJobContext;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class SessionCleanupJob implements ScheduledJob {

    @Override
    public String key() {
        return "session-cleanup";
    }

    @Override
    public String cron() {
        return "0 0 2 * * SUN";
    }

    @Override
    public String description() {
        return "Cleanup expired sessions";
    }

    @Override
    public boolean tenantScoped() {
        return false;
    }

    @Override
    public void execute(ScheduledJobContext context) {
        log.info("Job {} executed (system-wide)", key());
        // TODO: wire to session cleanup service
    }
}

