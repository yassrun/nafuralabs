package ma.nafura.etudes.service.port.capability;

import java.util.Optional;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class NoOpPrixComposantProposePortConfig {

    @Bean
    @ConditionalOnMissingBean(PrixComposantProposePort.class)
    public PrixComposantProposePort noOpPrixComposantProposePort() {
        return new PrixComposantProposePort() {
            @Override
            public boolean isAvailable() {
                return false;
            }

            @Override
            public Optional<Estimation> estimer(Contexte contexte) {
                return Optional.empty();
            }
        };
    }
}
