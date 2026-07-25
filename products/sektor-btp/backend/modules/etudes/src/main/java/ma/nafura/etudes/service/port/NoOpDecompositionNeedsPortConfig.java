package ma.nafura.etudes.service.port;

import java.util.List;
import ma.nafura.etudes.domain.model.CpsSection;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class NoOpDecompositionNeedsPortConfig {

    @Bean
    @ConditionalOnMissingBean(DecompositionNeedsPort.class)
    public DecompositionNeedsPort noOpDecompositionNeedsPort() {
        return new DecompositionNeedsPort() {
            @Override
            public boolean isAvailable() {
                return false;
            }

            @Override
            public List<BesoinComposant> extract(DpgfNoeud article, List<CpsSection> sections) {
                return List.of();
            }
        };
    }
}
