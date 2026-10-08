package ma.nafura.platform.framework.scheduling;

import java.util.HashSet;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Upserts {@link ScheduledJobRecord} rows from the code registry so the read-only listing has a table. */
@Component
@RequiredArgsConstructor
@Slf4j
public class ScheduledJobRecordSync {

    private final ScheduledJobRegistry registry;
    private final ScheduledJobRecordRepository records;
    private final ScheduledJobExecutionRepository executions;
    private final ScheduledJobProperties properties;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void sync() {
        Set<String> keys = new HashSet<>();
        for (ScheduledJob job : registry.getAll()) {
            keys.add(job.key());
            upsert(job);
        }
        for (ScheduledJobRecord orphan : records.findAll()) {
            if (!keys.contains(orphan.getJobKey())) {
                records.delete(orphan);
            }
        }
        log.info("Synced {} scheduled job record(s)", keys.size());
    }

    private void upsert(ScheduledJob job) {
        ScheduledJobRecord record = records.findByJobKey(job.key()).orElseGet(ScheduledJobRecord::new);
        record.setTenantId(null);
        record.setJobKey(job.key());
        record.setDescription(job.description());
        ScheduledJobProperties.JobProperties jobProps =
                properties.getJobs().getOrDefault(job.key(), new ScheduledJobProperties.JobProperties());
        String cron = (jobProps.getCron() != null && !jobProps.getCron().isBlank())
                ? jobProps.getCron()
                : job.cron();
        record.setCron(cron);
        record.setTenantScoped(job.tenantScoped());
        record.setEnabled(jobProps.isEnabled());
        record.setNameKey("administration.scheduledJobs.jobs." + job.key());
        executions.findFirstByJobKeyOrderByStartedAtDesc(job.key()).ifPresent(execution -> {
            record.setLastStatus(execution.getStatus() == null ? null : execution.getStatus().name());
            record.setLastStartedAt(execution.getStartedAt());
            record.setLastDurationMs(execution.getDurationMs());
        });
        records.save(record);
    }

    @Transactional
    public void refreshLastExecution(ScheduledJobExecution execution) {
        records.findByJobKey(execution.getJobKey()).ifPresent(record -> {
            record.setLastStatus(execution.getStatus() == null ? null : execution.getStatus().name());
            record.setLastStartedAt(execution.getStartedAt());
            record.setLastDurationMs(execution.getDurationMs());
            records.save(record);
        });
    }
}
