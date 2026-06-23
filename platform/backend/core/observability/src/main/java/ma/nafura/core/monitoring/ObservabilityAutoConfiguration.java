package ma.nafura.platform.observability;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Tag;
import io.micrometer.core.instrument.Tags;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.autoconfigure.metrics.MeterRegistryCustomizer;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.net.InetAddress;
import java.net.UnknownHostException;

/**
 * Auto-configuration for platform-level observability.
 * <p>
 * Provides common tags and metrics configuration that all applications inherit automatically.
 * This ensures consistent observability across the entire Nafura platform.
 * </p>
 * 
 * <h3>Features:</h3>
 * <ul>
 *   <li>Common tags: application, application_id, environment, instance</li>
 *   <li>JVM metrics (memory, GC, threads)</li>
 *   <li>HTTP server metrics (requests, latency)</li>
 *   <li>Database connection pool metrics</li>
 * </ul>
 */
@Configuration
@ConditionalOnClass(MeterRegistry.class)
@ConditionalOnProperty(prefix = "management.metrics", name = "enabled", havingValue = "true", matchIfMissing = true)
public class ObservabilityAutoConfiguration {

    @Value("${spring.application.name:unknown}")
    private String applicationName;

    @Value("${nafura.application.id:unknown}")
    private String applicationId;

    @Value("${nafura.environment:dev}")
    private String environment;

    /**
     * Adds common tags to all metrics for consistent filtering in Grafana.
     * Tags include: application, application_id, environment, and instance (hostname).
     */
    @Bean
    public MeterRegistryCustomizer<MeterRegistry> commonTagsCustomizer() {
        return registry -> {
            Tags commonTags = Tags.of(
                Tag.of("application", applicationName),
                Tag.of("application_id", applicationId),
                Tag.of("environment", environment),
                Tag.of("instance", getHostname())
            );
            registry.config().commonTags(commonTags);
        };
    }

    private String getHostname() {
        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (UnknownHostException e) {
            // In Kubernetes, use pod name from environment
            String podName = System.getenv("HOSTNAME");
            return podName != null ? podName : "unknown";
        }
    }
}

