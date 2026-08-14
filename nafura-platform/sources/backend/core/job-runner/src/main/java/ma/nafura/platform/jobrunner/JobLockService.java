package ma.nafura.platform.jobrunner;

import java.time.Duration;
import java.util.UUID;

public interface JobLockService {

    boolean tryAcquire(UUID jobId, Duration ttl);

    void release(UUID jobId);
}
