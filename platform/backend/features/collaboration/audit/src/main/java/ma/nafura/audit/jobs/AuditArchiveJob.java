package ma.nafura.platform.collaboration.audit.jobs;

import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.framework.scheduling.ScheduledJob;
import ma.nafura.platform.framework.scheduling.ScheduledJobContext;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class AuditArchiveJob implements ScheduledJob {

    @Override
    public String key() {
        return "audit-archive";
    }

    @Override
    public String cron() {
        return "0 0 3 1 * *";
    }

    @Override
    public String description() {
        return "Archive old audit log entries";
    }

    @Override
    public boolean tenantScoped() {
        return true;
    }

    @Override
    public void execute(ScheduledJobContext context) {
        log.info("Job {} executed for tenant {}", key(), context.tenantId());
        // TODO: wire to audit archive service
    }
}

