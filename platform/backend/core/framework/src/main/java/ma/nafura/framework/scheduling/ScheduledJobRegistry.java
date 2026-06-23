package ma.nafura.platform.framework.scheduling;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@Slf4j
public class ScheduledJobRegistry {

    private final Map<String, ScheduledJob> jobsByKey;

    public ScheduledJobRegistry(List<ScheduledJob> jobs) {
        this.jobsByKey = jobs.stream()
                .collect(Collectors.toUnmodifiableMap(
                        ScheduledJob::key,
                        Function.identity(),
                        (a, b) -> a));

        if (jobs.isEmpty()) {
            log.info("ScheduledJobRegistry initialized with no jobs.");
        } else {
            log.info("ScheduledJobRegistry initialized with {} jobs: {}", jobs.size(), jobsByKey.keySet());
        }
    }

    public List<ScheduledJob> getAll() {
        return List.copyOf(jobsByKey.values());
    }

    public Optional<ScheduledJob> getByKey(String key) {
        return Optional.ofNullable(jobsByKey.get(key));
    }
}

