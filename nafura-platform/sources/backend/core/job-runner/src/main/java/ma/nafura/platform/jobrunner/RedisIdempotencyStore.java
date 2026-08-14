package ma.nafura.platform.jobrunner;

import org.springframework.data.redis.core.StringRedisTemplate;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

public class RedisIdempotencyStore implements IdempotencyStore {

    private static final String PREFIX = "catalog:idempotency:";

    private final StringRedisTemplate redis;

    public RedisIdempotencyStore(StringRedisTemplate redis) {
        this.redis = redis;
    }

    @Override
    public Optional<String> findExistingJobId(String scope, String idempotencyKey, String payloadHash) {
        String value = redis.opsForValue().get(key(scope, idempotencyKey, payloadHash));
        return Optional.ofNullable(value);
    }

    @Override
    public void remember(String scope, String idempotencyKey, String payloadHash, UUID jobId, Duration ttl) {
        redis.opsForValue().set(key(scope, idempotencyKey, payloadHash), jobId.toString(), ttl);
    }

    private static String key(String scope, String idempotencyKey, String payloadHash) {
        return PREFIX + scope + ":" + idempotencyKey + ":" + payloadHash;
    }
}
