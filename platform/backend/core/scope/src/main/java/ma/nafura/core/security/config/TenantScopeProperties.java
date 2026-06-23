package ma.nafura.platform.scope.security.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Data
@ConfigurationProperties(prefix = "nafura.security.tenant")
public class TenantScopeProperties {

    /**
     * Supported values: none, single, multi.
     */
    private String mode = "multi";

    /**
     * Enables scoped context wiring.
     */
    private boolean enabled = true;

    /**
     * Paths to skip scoped context processing.
     */
    private List<String> skipPaths = new ArrayList<>(Arrays.asList(
            "/api/auth/",
            "/actuator/",
            "/api/sync/health"
    ));
}

