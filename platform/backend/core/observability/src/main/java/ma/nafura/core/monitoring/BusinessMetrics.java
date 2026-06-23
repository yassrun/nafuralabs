package ma.nafura.platform.observability;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

/**
 * Platform-level business metrics helper.
 * <p>
 * Provides convenient methods for recording custom business metrics
 * that are consistent across all products.
 * </p>
 * 
 * <h3>Usage Example:</h3>
 * <pre>{@code
 * @Autowired
 * private BusinessMetrics metrics;
 * 
 * // Count operations
 * metrics.incrementCounter("extractions", "type", "invoice");
 * 
 * // Time operations
 * metrics.recordTiming("ai_processing", processingTimeMs);
 * 
 * // Time with supplier
 * Result result = metrics.timed("extraction", () -> performExtraction());
 * }</pre>
 */
@Component
public class BusinessMetrics {

    private static final String METRIC_PREFIX = "nafura_";
    
    private final MeterRegistry registry;

    public BusinessMetrics(MeterRegistry registry) {
        this.registry = registry;
    }

    /**
     * Increment a counter metric.
     * 
     * @param name Metric name (will be prefixed with 'nafura_')
     * @param tags Optional key-value tag pairs
     */
    public void incrementCounter(String name, String... tags) {
        Counter.builder(METRIC_PREFIX + name)
                .tags(tags)
                .register(registry)
                .increment();
    }

    /**
     * Increment a counter by a specific amount.
     */
    public void incrementCounter(String name, double amount, String... tags) {
        Counter.builder(METRIC_PREFIX + name)
                .tags(tags)
                .register(registry)
                .increment(amount);
    }

    /**
     * Record a timing measurement in milliseconds.
     * 
     * @param name Metric name (will be prefixed with 'nafura_')
     * @param milliseconds Duration in milliseconds
     * @param tags Optional key-value tag pairs
     */
    public void recordTiming(String name, long milliseconds, String... tags) {
        Timer.builder(METRIC_PREFIX + name + "_duration")
                .tags(tags)
                .register(registry)
                .record(milliseconds, TimeUnit.MILLISECONDS);
    }

    /**
     * Time a supplier and return its result.
     * 
     * @param name Metric name (will be prefixed with 'nafura_')
     * @param supplier The operation to time
     * @param tags Optional key-value tag pairs
     * @return The result of the supplier
     */
    public <T> T timed(String name, Supplier<T> supplier, String... tags) {
        Timer timer = Timer.builder(METRIC_PREFIX + name + "_duration")
                .tags(tags)
                .register(registry);
        return timer.record(supplier);
    }

    /**
     * Time a runnable operation.
     */
    public void timed(String name, Runnable runnable, String... tags) {
        Timer timer = Timer.builder(METRIC_PREFIX + name + "_duration")
                .tags(tags)
                .register(registry);
        timer.record(runnable);
    }

    /**
     * Get the underlying MeterRegistry for advanced use cases.
     */
    public MeterRegistry getRegistry() {
        return registry;
    }
}

