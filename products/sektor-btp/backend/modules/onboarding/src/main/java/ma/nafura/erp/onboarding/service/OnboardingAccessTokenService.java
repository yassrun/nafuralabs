package ma.nafura.erp.onboarding.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import ma.nafura.erp.onboarding.config.OnboardingProperties;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OnboardingAccessTokenService {

    private static final String ISSUER = "nafura-onboarding-dev";

    private final JwtEncoder onboardingJwtEncoder;
    private final OnboardingProperties onboardingProperties;

    public IssuedToken issue(UUID userId, String email) {
        return issue(userId, email, null);
    }

    public IssuedToken issue(UUID userId, String email, UUID tenantId) {
        Instant now = Instant.now();
        long hours = Math.max(1, onboardingProperties.getAccessTokenExpiryHours());
        Instant expiresAt = now.plus(hours, ChronoUnit.HOURS);
        JwtClaimsSet.Builder claims = JwtClaimsSet.builder()
            .issuer(ISSUER)
            .subject(userId.toString())
            .claim("email", email)
            .issuedAt(now)
            .expiresAt(expiresAt);
        if (tenantId != null) {
            claims.claim("tid", tenantId.toString());
        }
        JwtClaimsSet built = claims.build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = onboardingJwtEncoder.encode(JwtEncoderParameters.from(header, built)).getTokenValue();
        return new IssuedToken(token, ChronoUnit.SECONDS.between(now, expiresAt));
    }

    public record IssuedToken(String accessToken, long expiresInSeconds) {}
}
