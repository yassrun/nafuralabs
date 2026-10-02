package ma.nafura.platform.identity.config;

import ma.nafura.platform.identity.service.port.IdentityKeycloakProvisioningPort;
import ma.nafura.platform.identity.service.port.NoOpIdentityKeycloakProvisioningPort;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;

@AutoConfiguration
public class NafuraIdentityAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    IdentityKeycloakProvisioningPort identityKeycloakProvisioningPort() {
        return new NoOpIdentityKeycloakProvisioningPort();
    }
}
