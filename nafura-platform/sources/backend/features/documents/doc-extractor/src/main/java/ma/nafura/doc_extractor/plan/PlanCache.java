package ma.nafura.platform.documents.docextractor.plan;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

/**
 * Cache de plans par empreinte de trame, <strong>par tenant</strong>.
 */
@Component
public class PlanCache {

    private final ConcurrentHashMap<String, ReadingPlan> plans = new ConcurrentHashMap<>();

    public Optional<ReadingPlan> get(String tenantId, String fingerprint) {
        return Optional.ofNullable(plans.get(LayoutFingerprint.cacheKey(tenantId, fingerprint)));
    }

    public void put(String tenantId, String fingerprint, ReadingPlan plan) {
        if (plan == null) {
            return;
        }
        plans.put(LayoutFingerprint.cacheKey(tenantId, fingerprint), plan);
    }
}
