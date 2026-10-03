package ma.nafura.platform.administration.iam.config;

import ma.nafura.platform.administration.iam.service.port.InvitationEmailPort;
import ma.nafura.platform.administration.iam.service.port.NoOpInvitationEmailPort;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;

@AutoConfiguration
public class NafuraIamAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    InvitationEmailPort invitationEmailPort() {
        return new NoOpInvitationEmailPort();
    }
}
