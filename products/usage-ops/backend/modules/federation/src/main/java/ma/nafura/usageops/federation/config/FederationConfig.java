package ma.nafura.usageops.federation.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(UsageOpsProperties.class)
public class FederationConfig {
}
