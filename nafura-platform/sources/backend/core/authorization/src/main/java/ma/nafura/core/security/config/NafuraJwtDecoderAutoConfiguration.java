package ma.nafura.platform.authorization.security.config;

import ma.nafura.platform.authorization.security.properties.SecurityProperties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.security.autoconfigure.SecurityAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtIssuerValidator;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.util.StringUtils;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Provides the platform {@code jwtDecoder} bean when the app does not define one.
 *
 * <ul>
 *   <li>OIDC via {@code spring.security.oauth2.resourceserver.jwt.jwk-set-uri} or {@code issuer-uri}</li>
 *   <li>Lab HS256 via {@code nafura.security.jwt.hs256-secret}</li>
 *   <li>Both → composite (HS256 first, then OIDC), same as former Sektor onboarding wiring</li>
 * </ul>
 */
@AutoConfiguration(before = {SecurityAutoConfiguration.class, NafuraSecurityAutoConfiguration.class})
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
@ConditionalOnProperty(name = "nafura.security.enabled", havingValue = "true", matchIfMissing = true)
@EnableConfigurationProperties(SecurityProperties.class)
public class NafuraJwtDecoderAutoConfiguration {

    @Bean(name = "jwtDecoder")
    @ConditionalOnMissingBean(name = "jwtDecoder")
    JwtDecoder jwtDecoder(
            SecurityProperties securityProperties,
            @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri:}") String jwkSetUri,
            @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri:}") String issuerUri,
            @Value("${nafura.security.oidc.issuer:}") String expectedIssuer,
            @Value("${nafura.security.oidc.client-id:}") String clientId
    ) {
        String hs256Secret = securityProperties.getJwt() != null
                ? securityProperties.getJwt().getHs256Secret()
                : null;

        JwtDecoder oidcDecoder = buildOidcDecoder(jwkSetUri, issuerUri, expectedIssuer, clientId);
        JwtDecoder hs256Decoder = buildHs256Decoder(hs256Secret);

        if (hs256Decoder != null && oidcDecoder != null) {
            return token -> {
                try {
                    return hs256Decoder.decode(token);
                } catch (JwtException ignored) {
                    return oidcDecoder.decode(token);
                }
            };
        }
        if (hs256Decoder != null) {
            return hs256Decoder;
        }
        if (oidcDecoder != null) {
            return oidcDecoder;
        }
        throw new IllegalStateException(
                "No JWT decoder configured. Set spring.security.oauth2.resourceserver.jwt.jwk-set-uri "
                        + "(or issuer-uri), and/or nafura.security.jwt.hs256-secret, "
                        + "or declare a bean named jwtDecoder.");
    }

    /**
     * The realm is shared by every product: a token must come from the expected issuer and be issued to this
     * product's client ({@code azp}, or listed in {@code aud}).
     */
    private static JwtDecoder buildOidcDecoder(String jwkSetUri, String issuerUri, String expectedIssuer, String clientId) {
        NimbusJwtDecoder decoder;
        if (StringUtils.hasText(jwkSetUri)) {
            decoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri.trim()).build();
        } else if (StringUtils.hasText(issuerUri)) {
            decoder = NimbusJwtDecoder.withIssuerLocation(issuerUri.trim()).build();
        } else {
            return null;
        }
        List<OAuth2TokenValidator<Jwt>> validators = new ArrayList<>(List.of(JwtValidators.createDefault()));
        if (StringUtils.hasText(expectedIssuer)) {
            validators.add(new JwtIssuerValidator(expectedIssuer.trim()));
        }
        if (StringUtils.hasText(clientId)) {
            validators.add(token -> issuedTo(token, clientId));
        }
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(validators));
        return decoder;
    }

    private static OAuth2TokenValidatorResult issuedTo(Jwt token, String clientId) {
        boolean issued = clientId.equals(token.getClaimAsString("azp"))
                || (token.getAudience() != null && token.getAudience().contains(clientId));
        return issued ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Token not issued to " + clientId, null));
    }

    private static JwtDecoder buildHs256Decoder(String secret) {
        if (!StringUtils.hasText(secret)) {
            return null;
        }
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalStateException(
                    "nafura.security.jwt.hs256-secret must be at least 32 bytes for HS256");
        }
        SecretKey key = new SecretKeySpec(keyBytes, "HmacSHA256");
        return NimbusJwtDecoder.withSecretKey(key).build();
    }
}
