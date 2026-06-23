package ma.nafura.erp.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "nafura.demo")
public class DemoSeedProperties {

    /**
     * When false (default), runtime {@code seedIfEmpty()} calls are no-ops.
     * Enable only for commercial demo / local showcases ({@code NAFURA_DEMO_RUNTIME_SEED=true}).
     */
    private boolean runtimeSeedEnabled = false;
}
