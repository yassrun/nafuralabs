package ma.nafura.platform.collaboration.notification.jobs;

import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.framework.scheduling.ScheduledJob;
import ma.nafura.platform.framework.scheduling.ScheduledJobContext;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class EmailDigestJob implements ScheduledJob {

    @Override
    public String key() {
        return "email-digest";
    }

    @Override
    public String cron() {
        return "0 0 8 * * *";
    }

    @Override
    public String description() {
        return "Send daily notification digest";
    }

    @Override
    public boolean tenantScoped() {
        return true;
    }

    @Override
    public void execute(ScheduledJobContext context) {
        log.info("Job {} executed for tenant {}", key(), context.tenantId());
        // TODO: wire to NotificationDigestService
    }
}

