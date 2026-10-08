package ma.nafura.platform.framework.scheduling;

import java.util.UUID;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.framework.record.ReadOnlyRecordController;
import ma.nafura.platform.framework.record.RecordRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Scheduled jobs of the platform — read-only record (registry + last execution).
 * Permissions: administration.operations.scheduled-jobs.{read,update} (trigger = update).
 */
@RestController
@RequestMapping("/api/v1/platform/admin/scheduled-jobs")
@SecuredResource(domain = "administration", feature = "operations", resource = "scheduled-jobs")
public class ScheduledJobController extends ReadOnlyRecordController<ScheduledJobRecord> {

    private final ScheduledJobRecordRepository repository;
    private final ScheduledJobExecutionRepository executionRepository;
    private final ScheduledJobExecutor executor;

    public ScheduledJobController(
            ScheduledJobRecordRepository repository,
            ScheduledJobExecutionRepository executionRepository,
            ScheduledJobExecutor executor) {
        this.repository = repository;
        this.executionRepository = executionRepository;
        this.executor = executor;
    }

    @Override
    protected RecordRepository<ScheduledJobRecord> repository() {
        return repository;
    }

    @Override
    protected String recordResource() {
        return "records/scheduled-job.json";
    }

    @Override
    protected String labelField() {
        return "jobKey";
    }

    @Override
    protected Sort defaultSort() {
        return Sort.by(Sort.Direction.ASC, "jobKey");
    }

    @Override
    protected boolean includeSharedTenantRows() {
        return true;
    }

    @GetMapping("/by-key/{key}/executions")
    @RequirePermission("read")
    public Page<ScheduledJobExecution> getExecutions(
            @PathVariable String key,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return executionRepository.findByJobKeyOrderByStartedAtDesc(key, PageRequest.of(page, size));
    }

    @PostMapping("/{id}/trigger")
    @RequirePermission("update")
    public TriggerResponse trigger(@PathVariable UUID id) {
        ScheduledJobRecord job = find(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Scheduled job not found"));
        UUID executionId = executor.triggerNow(job.getJobKey());
        return new TriggerResponse(executionId);
    }

    /** Kept for the detail page that still addresses jobs by key. */
    @PostMapping("/by-key/{key}/trigger")
    @RequirePermission("update")
    public TriggerResponse triggerByKey(@PathVariable String key) {
        UUID executionId = executor.triggerNow(key);
        return new TriggerResponse(executionId);
    }

    public static class TriggerResponse {
        private UUID executionId;

        public TriggerResponse(UUID executionId) {
            this.executionId = executionId;
        }

        public UUID getExecutionId() {
            return executionId;
        }

        public void setExecutionId(UUID executionId) {
            this.executionId = executionId;
        }
    }
}
