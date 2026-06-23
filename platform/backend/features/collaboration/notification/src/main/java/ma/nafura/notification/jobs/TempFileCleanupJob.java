package ma.nafura.platform.collaboration.notification.jobs;

import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.framework.scheduling.ScheduledJob;
import ma.nafura.platform.framework.scheduling.ScheduledJobContext;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class TempFileCleanupJob implements ScheduledJob {

    @Override
    public String key() {
        return "temp-file-cleanup";
    }

    @Override
    public String cron() {
        return "0 0 1 * * *";
    }

    @Override
    public String description() {
        return "Cleanup temporary files";
    }

    @Override
    public boolean tenantScoped() {
        return false;
    }

    @Override
    public void execute(ScheduledJobContext context) {
        log.info("Job {} executed (system-wide)", key());
        // TODO: wire to temp file cleanup service
    }
}

