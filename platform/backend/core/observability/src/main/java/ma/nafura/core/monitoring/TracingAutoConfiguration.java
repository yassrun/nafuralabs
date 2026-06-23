package ma.nafura.platform.observability;

import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.api.trace.Tracer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Auto-configuration for distributed tracing using OpenTelemetry.
 * <p>
 * Configures trace export to Tempo/Jaeger and provides a Tracer bean
 * for manual span creation when needed.
 * </p>
 * 
 * <h3>Environment Variables (set by K8s):</h3>
 * <ul>
 *   <li>OTEL_SERVICE_NAME - Service name for traces</li>
 *   <li>OTEL_EXPORTER_OTLP_ENDPOINT - Tempo/Jaeger endpoint</li>
 *   <li>OTEL_TRACES_SAMPLER - Sampling strategy</li>
 * </ul>
 */
@Configuration
@ConditionalOnClass(OpenTelemetry.class)
@ConditionalOnProperty(prefix = "management.tracing", name = "enabled", havingValue = "true", matchIfMissing = true)
public class TracingAutoConfiguration {

    private static final Logger log = LoggerFactory.getLogger(TracingAutoConfiguration.class);

    @Value("${spring.application.name:nafura}")
    private String applicationName;

    /**
     * Provides a Tracer bean for manual span creation.
     * Most tracing is automatic via OpenTelemetry instrumentation,
     * but this allows custom spans for business-specific tracing.
     */
    @Bean
    public Tracer nafuraTracer(OpenTelemetry openTelemetry) {
        log.info("Initializing OpenTelemetry tracer for service: {}", applicationName);
        return openTelemetry.getTracer(applicationName);
    }
}

