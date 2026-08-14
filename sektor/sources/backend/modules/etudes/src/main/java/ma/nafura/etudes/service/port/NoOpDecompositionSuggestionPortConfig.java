package ma.nafura.etudes.service.port;

import java.util.List;
import ma.nafura.etudes.api.request.ComposantDpuInputDto;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class NoOpDecompositionSuggestionPortConfig {

    @Bean
    @ConditionalOnMissingBean(DecompositionSuggestionPort.class)
    public DecompositionSuggestionPort noOpDecompositionSuggestionPort() {
        return new DecompositionSuggestionPort() {
            @Override
            public boolean isAvailable() {
                return false;
            }

            @Override
            public List<ComposantDpuInputDto> suggest(DpgfNoeud article) {
                return List.of();
            }
        };
    }
}
