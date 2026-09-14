package ma.nafura.platform.collaboration.audit.jobs;

import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.collaboration.audit.repository.AuditEventRepository;
import ma.nafura.platform.framework.scheduling.ScheduledJob;
import ma.nafura.platform.framework.scheduling.ScheduledJobContext;
import org.springframework.stereotype.Component;

/**
 * Retention is keep-all. The job only reports volume so we notice growth
 * without deleting evidence.
 */
@Component
@Slf4j
public class AuditArchiveJob implements ScheduledJob {

    private final AuditEventRepository auditEventRepository;

    public AuditArchiveJob(AuditEventRepository auditEventRepository) {
        this.auditEventRepository = auditEventRepository;
    }

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
        return "Report audit_events volume (no deletion)";
    }

    @Override
    public boolean tenantScoped() {
        return true;
    }

    @Override
    public void execute(ScheduledJobContext context) {
        long count = auditEventRepository.countByTenantId(context.tenantId());
        log.info("Job {} tenant {} audit_events={}", key(), context.tenantId(), count);
    }
}
