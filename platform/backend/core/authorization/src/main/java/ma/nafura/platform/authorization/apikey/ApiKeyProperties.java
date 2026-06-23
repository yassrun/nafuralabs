package ma.nafura.platform.authorization.apikey;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "nafura.security.api-keys")
public class ApiKeyProperties {

    /**
     * Length of the random key segment (excluding prefix).
     */
    private int randomLength = 32;

    /**
     * Maximum number of active API keys per tenant.
     */
    private int maxKeysPerTenant = 20;
}

