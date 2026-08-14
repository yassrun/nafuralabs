package ma.nafura.platform.framework.scheduling;

import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/platform/admin/scheduled-jobs")
@RequiredArgsConstructor
public class ScheduledJobController {

    private final ScheduledJobRegistry registry;
    private final ScheduledJobExecutionRepository executionRepository;
    private final ScheduledJobExecutor executor;

    @GetMapping
    public List<ScheduledJobSummaryDto> listJobs() {
        return registry.getAll().stream()
                .map(job -> {
                    ScheduledJobSummaryDto dto = new ScheduledJobSummaryDto();
                    dto.setKey(job.key());
                    dto.setDescription(job.description());
                    dto.setCron(job.cron());
                    dto.setTenantScoped(job.tenantScoped());
                    executionRepository.findFirstByJobKeyOrderByStartedAtDesc(job.key())
                            .ifPresent(execution -> dto.setLastExecution(
                                    new ScheduledJobSummaryDto.LastExecutionDto(
                                            execution.getId(),
                                            execution.getStartedAt(),
                                            execution.getStatus(),
                                            execution.getDurationMs()
                                    )
                            ));
                    return dto;
                })
                .toList();
    }

    @GetMapping("/{key}/executions")
    public Page<ScheduledJobExecution> getExecutions(
            @PathVariable String key,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return executionRepository.findByJobKeyOrderByStartedAtDesc(key, PageRequest.of(page, size));
    }

    @PostMapping("/{key}/trigger")
    public TriggerResponse triggerJob(@PathVariable String key) {
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

