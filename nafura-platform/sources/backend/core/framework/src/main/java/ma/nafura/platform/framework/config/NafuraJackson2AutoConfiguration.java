package ma.nafura.platform.framework.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;

/** Boot 4 auto-configures Jackson 3 only; platform services still inject a Jackson 2 {@link ObjectMapper}. */
@AutoConfiguration
public class NafuraJackson2AutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    ObjectMapper objectMapper() {
        return new ObjectMapper();
    }
}
