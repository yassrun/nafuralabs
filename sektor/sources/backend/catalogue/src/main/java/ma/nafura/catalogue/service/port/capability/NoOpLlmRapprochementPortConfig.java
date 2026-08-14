package ma.nafura.catalogue.service.port.capability;

import java.util.List;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class NoOpLlmRapprochementPortConfig {

    @Bean
    @ConditionalOnMissingBean(LlmRapprochementPort.class)
    public LlmRapprochementPort noOpLlmRapprochementPort() {
        return new LlmRapprochementPort() {
            @Override
            public boolean isAvailable() {
                return false;
            }

            @Override
            public List<Suggestion> suggerer(String libelle, List<CatalogueSnippet> corpus, int limit) {
                return List.of();
            }
        };
    }
}
