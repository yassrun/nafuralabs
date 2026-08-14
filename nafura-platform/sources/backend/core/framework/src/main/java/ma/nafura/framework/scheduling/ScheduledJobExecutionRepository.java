package ma.nafura.platform.framework.scheduling;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ScheduledJobExecutionRepository extends JpaRepository<ScheduledJobExecution, UUID> {

    Optional<ScheduledJobExecution> findFirstByJobKeyOrderByStartedAtDesc(String jobKey);

    Page<ScheduledJobExecution> findByJobKeyOrderByStartedAtDesc(String jobKey, Pageable pageable);
}

