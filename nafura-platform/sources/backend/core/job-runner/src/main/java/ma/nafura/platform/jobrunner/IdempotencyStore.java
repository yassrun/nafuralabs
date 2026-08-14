package ma.nafura.platform.jobrunner;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

public interface IdempotencyStore {

    Optional<String> findExistingJobId(String scope, String idempotencyKey, String payloadHash);

    void remember(String scope, String idempotencyKey, String payloadHash, UUID jobId, Duration ttl);
}
