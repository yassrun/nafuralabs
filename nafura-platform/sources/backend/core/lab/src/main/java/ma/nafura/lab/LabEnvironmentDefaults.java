package ma.nafura.lab;

import java.util.HashMap;
import java.util.Map;

import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.io.DefaultResourceLoader;

/** Lowest-priority defaults so a lab app starts with no external service; any product setting overrides them. */
public class LabEnvironmentDefaults implements EnvironmentPostProcessor {

    /** Generated at build time from the modules on the classpath (nafura-migrations.gradle). */
    static final String CHANGELOG = "classpath:nafura/db/changelog-master.yaml";

    static final Map<String, Object> DEFAULTS = Map.of(
            "otel.sdk.disabled", "true",
            "management.otlp.metrics.export.enabled", "false",
            "management.tracing.export.enabled", "false",
            "management.opentelemetry.logging.export.otlp.enabled", "false",
            "management.health.redis.enabled", "false"
    );

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Map<String, Object> defaults = new HashMap<>();
        // Outside the lab, the lifecycle job migrates the database: Liquibase never runs in the app.
        boolean lab = environment.getProperty("nafura.lab.enabled", Boolean.class, false);
        boolean changelog = new DefaultResourceLoader(application.getClassLoader()).getResource(CHANGELOG).exists();
        defaults.put("spring.liquibase.enabled", Boolean.toString(lab && changelog));
        if (lab) {
            defaults.putAll(DEFAULTS);
            if (changelog) {
                // Same SQL as staging/prod, so the entities are validated against it like there.
                defaults.put("spring.liquibase.change-log", CHANGELOG);
                defaults.put("spring.jpa.hibernate.ddl-auto", "validate");
            }
        }
        environment.getPropertySources().addLast(new MapPropertySource("nafuraLabDefaults", defaults));
    }
}
