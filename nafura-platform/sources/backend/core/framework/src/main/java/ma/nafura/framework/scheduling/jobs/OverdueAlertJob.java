package ma.nafura.platform.framework.scheduling.jobs;

import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.framework.scheduling.ScheduledJob;
import ma.nafura.platform.framework.scheduling.ScheduledJobContext;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class OverdueAlertJob implements ScheduledJob {

    @Override
    public String key() {
        return "overdue-alert";
    }

    @Override
    public String cron() {
        return "0 0 9 * * *";
    }

    @Override
    public String description() {
        return "Send alerts for overdue items";
    }

    @Override
    public boolean tenantScoped() {
        return true;
    }

    @Override
    public void execute(ScheduledJobContext context) {
        log.info("Job {} executed for tenant {}", key(), context.tenantId());
        // TODO: wire to overdue alert service
    }
}

