package ma.nafura.buildintelligence.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.web.client.RestClient;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Configuration
public class BuildIntelligenceConfiguration {

    @Bean
    RestClient.Builder restClientBuilder() {
        return RestClient.builder();
    }

    @Bean(name = "jwtDecoder")
    @Primary
    @ConditionalOnProperty(name = "build-intelligence.dev-jwt.enabled", havingValue = "true", matchIfMissing = true)
    JwtDecoder buildIntelligenceJwtDecoder(
            @Value("${build-intelligence.dev-jwt.secret}") String secret,
            @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}") String jwkSetUri
    ) {
        var key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        JwtDecoder devDecoder = NimbusJwtDecoder.withSecretKey(key).build();
        JwtDecoder keycloakDecoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
        return token -> {
            try {
                return devDecoder.decode(token);
            } catch (JwtException devEx) {
                return keycloakDecoder.decode(token);
            }
        };
    }
}
