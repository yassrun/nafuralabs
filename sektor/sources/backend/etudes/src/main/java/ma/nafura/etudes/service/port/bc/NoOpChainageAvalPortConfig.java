package ma.nafura.etudes.service.port.bc;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class NoOpChainageAvalPortConfig {

    @Bean
    @ConditionalOnMissingBean(ChainageAvalPort.class)
    public ChainageAvalPort noOpChainageAvalPort() {
        return command -> {
            throw new IllegalStateException("etudes.chainage.port_non_cable");
        };
    }
}
