package ma.nafura.socle.onboarding.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

/**
 * Onboarding lab token <em>issuance</em> only.
 * JWT <em>validation</em> is owned by platform {@code authorization}
 * ({@code nafura.security.jwt.hs256-secret} + OIDC jwk/issuer).
 */
@Configuration
@ConditionalOnProperty(name = "nafura.onboarding.v2-enabled", havingValue = "true", matchIfMissing = true)
public class OnboardingDevSecurityConfiguration {

    @Bean
    JwtEncoder onboardingJwtEncoder(
        @Value("${nafura.onboarding.dev-jwt-secret:nafura-local-onboarding-jwt-secret-32b-min}") String secret
    ) {
        SecretKey key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        return new NimbusJwtEncoder(new ImmutableSecret<>(key));
    }
}
