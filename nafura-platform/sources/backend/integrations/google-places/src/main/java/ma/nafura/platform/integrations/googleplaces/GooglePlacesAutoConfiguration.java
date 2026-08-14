package ma.nafura.platform.integrations.googleplaces;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(GooglePlacesProperties.class)
public class GooglePlacesAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public GooglePlacesClient googlePlacesClient(GooglePlacesProperties properties, ObjectMapper objectMapper) {
        return new HttpGooglePlacesClient(properties, objectMapper);
    }
}
