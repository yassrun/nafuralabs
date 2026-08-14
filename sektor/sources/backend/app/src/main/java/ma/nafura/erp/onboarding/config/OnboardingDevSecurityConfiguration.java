package ma.nafura.erp.onboarding.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

@Configuration
@ConditionalOnProperty(name = "nafura.onboarding.v2-enabled", havingValue = "true", matchIfMissing = true)
public class OnboardingDevSecurityConfiguration {

    private static final Logger log = LoggerFactory.getLogger(OnboardingDevSecurityConfiguration.class);

    @Bean
    JwtEncoder onboardingJwtEncoder(
        @Value("${nafura.onboarding.dev-jwt-secret:nafura-local-onboarding-jwt-secret-32b-min}") String secret
    ) {
        SecretKey key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        return new NimbusJwtEncoder(new ImmutableSecret<>(key));
    }

    @Bean(name = "devOnboardingJwtFilter")
    DevOnboardingJwtFilter devOnboardingJwtFilter(@Qualifier("jwtDecoder") JwtDecoder jwtDecoder) {
        return new DevOnboardingJwtFilter(jwtDecoder);
    }

    @Bean(name = "jwtDecoder")
    @Primary
    JwtDecoder jwtDecoder(
        @Value("${nafura.onboarding.dev-jwt-secret:nafura-local-onboarding-jwt-secret-32b-min}") String secret,
        @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}") String jwkSetUri
    ) {
        SecretKey key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        JwtDecoder devDecoder = NimbusJwtDecoder.withSecretKey(key).build();
        JwtDecoder keycloakDecoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();

        return token -> {
            try {
                var jwt = devDecoder.decode(token);
                log.debug("Authenticated onboarding dev JWT for sub={}", jwt.getSubject());
                return jwt;
            } catch (JwtException devEx) {
                log.debug("Dev JWT decode failed, trying Keycloak: {}", devEx.getMessage());
                try {
                    return keycloakDecoder.decode(token);
                } catch (JwtException kcEx) {
                    throw devEx;
                }
            }
        };
    }
}
