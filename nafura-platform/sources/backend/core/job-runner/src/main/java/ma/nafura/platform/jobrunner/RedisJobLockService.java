package ma.nafura.platform.jobrunner;

import org.springframework.data.redis.core.StringRedisTemplate;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

public class RedisJobLockService implements JobLockService {

    private static final String PREFIX = "catalog:job:lock:";

    private final StringRedisTemplate redis;

    public RedisJobLockService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    @Override
    public boolean tryAcquire(UUID jobId, Duration ttl) {
        Boolean acquired = redis.opsForValue().setIfAbsent(PREFIX + jobId, "1", ttl);
        return Boolean.TRUE.equals(acquired);
    }

    @Override
    public void release(UUID jobId) {
        redis.delete(PREFIX + jobId);
    }
}
