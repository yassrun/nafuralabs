package ma.nafura.platform.framework.scheduling;

import java.util.Optional;
import ma.nafura.platform.framework.record.RecordRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ScheduledJobRecordRepository extends RecordRepository<ScheduledJobRecord> {

    Optional<ScheduledJobRecord> findByJobKey(String jobKey);
}
