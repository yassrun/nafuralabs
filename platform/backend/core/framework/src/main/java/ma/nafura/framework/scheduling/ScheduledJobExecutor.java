package ma.nafura.platform.framework.scheduling;

import jakarta.annotation.PostConstruct;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.scheduling.Trigger;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ScheduledJobExecutor {

    private final ThreadPoolTaskScheduler taskScheduler;
    private final ScheduledJobRegistry registry;
    private final ScheduledJobExecutionRepository executionRepository;
    private final ScheduledJobProperties properties;
    private final ObjectProvider<TenantProvider> tenantProvider;

    @PostConstruct
    public void scheduleJobs() {
        if (!properties.isEnabled()) {
            log.info("Scheduling is disabled via configuration (nafura.scheduling.enabled=false)");
            return;
        }

        for (ScheduledJob job : registry.getAll()) {
            String key = job.key();
            ScheduledJobProperties.JobProperties jobProps =
                    properties.getJobs().getOrDefault(key, new ScheduledJobProperties.JobProperties());

            if (!jobProps.isEnabled()) {
                log.info("Scheduled job '{}' is disabled via configuration", key);
                continue;
            }

            String cron = (jobProps.getCron() != null && !jobProps.getCron().isBlank())
                    ? jobProps.getCron()
                    : job.cron();

            Trigger trigger = new CronTrigger(cron, ZoneId.systemDefault());
            log.info("Scheduling job '{}' with cron='{}', tenantScoped={}", key, cron, job.tenantScoped());

            taskScheduler.schedule(() -> runJob(job), trigger);
        }
    }

    private void runJob(ScheduledJob job) {
        if (job.tenantScoped()) {
            TenantProvider provider = tenantProvider.getIfAvailable();
            if (provider == null) {
                log.warn("No TenantProvider available; skipping tenant-scoped job '{}'", job.key());
                return;
            }

            provider.activeTenantIds().forEach(tenantId -> executeOnce(job, tenantId));
        } else {
            executeOnce(job, null);
        }
    }

    public UUID triggerNow(String key) {
        ScheduledJob job = registry.getByKey(key)
                .orElseThrow(() -> new IllegalArgumentException("Scheduled job not found: " + key));

        UUID tenantId = null;
        if (job.tenantScoped()) {
            TenantProvider provider = tenantProvider.getIfAvailable();
            if (provider == null) {
                throw new IllegalStateException("No TenantProvider available for tenant-scoped job '" + key + "'");
            }
            // For manual trigger, use current tenant if set, otherwise first active.
            tenantId = TenantContext.getTenantId();
            if (tenantId == null) {
                tenantId = provider.activeTenantIds().findFirst()
                        .orElseThrow(() -> new IllegalStateException("No active tenants available to run job '" + key + "'"));
            }
        }

        UUID finalTenantId = tenantId;
        taskScheduler.execute(() -> executeOnce(job, finalTenantId));

        // We don't have the execution ID until persisted; return null here.
        return null;
    }

    private void executeOnce(ScheduledJob job, UUID tenantId) {
        OffsetDateTime start = OffsetDateTime.now();
        ScheduledJobExecution execution = ScheduledJobExecution.builder()
                .jobKey(job.key())
                .tenantId(tenantId)
                .startedAt(start)
                .status(ScheduledJobStatus.RUNNING)
                .build();

        execution = executionRepository.save(execution);

        try {
            if (tenantId != null) {
                TenantContext.setTenantId(tenantId);
            }

            log.info("Executing scheduled job '{}' for tenant {}", job.key(), tenantId);
            job.execute(new ScheduledJobContext(job.key(), tenantId));

            OffsetDateTime end = OffsetDateTime.now();
            long durationMs = end.toInstant().toEpochMilli() - start.toInstant().toEpochMilli();

            execution.setEndedAt(end);
            execution.setDurationMs(durationMs);
            execution.setStatus(ScheduledJobStatus.SUCCESS);
            executionRepository.save(execution);
        } catch (Exception ex) {
            log.error("Scheduled job '{}' failed for tenant {}: {}", job.key(), tenantId, ex.getMessage(), ex);
            OffsetDateTime end = OffsetDateTime.now();
            long durationMs = end.toInstant().toEpochMilli() - start.toInstant().toEpochMilli();

            execution.setEndedAt(end);
            execution.setDurationMs(durationMs);
            execution.setStatus(ScheduledJobStatus.FAILED);

            String message = ex.getMessage();
            if (message != null && message.length() > 2000) {
                message = message.substring(0, 2000);
            }
            execution.setErrorMessage(message);
            executionRepository.save(execution);
        } finally {
            if (tenantId != null) {
                TenantContext.clear();
            }
        }
    }
}

