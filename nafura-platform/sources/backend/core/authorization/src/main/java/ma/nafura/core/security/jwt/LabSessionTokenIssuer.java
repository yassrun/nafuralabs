package ma.nafura.platform.authorization.security.jwt;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

/**
 * Mints a lab HS256 access token. The app supplies the user; this class only signs the claims.
 */
public final class LabSessionTokenIssuer {

    private LabSessionTokenIssuer() {
    }

    public record Request(
            String secret,
            String issuer,
            String subject,
            String email,
            String givenName,
            String familyName,
            String displayName,
            String role,
            boolean superAdmin,
            long ttlSeconds
    ) {
    }

    public static String issue(Request request) {
        if (request.secret() == null || request.secret().getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalArgumentException("Lab JWT secret must be at least 32 bytes");
        }
        SecretKey key = new SecretKeySpec(request.secret().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        Instant now = Instant.now();
        JwtClaimsSet.Builder claims = JwtClaimsSet.builder()
                .issuer(request.issuer())
                .issuedAt(now)
                .expiresAt(now.plusSeconds(request.ttlSeconds()))
                .subject(request.subject())
                .claim("email", request.email())
                .claim("given_name", request.givenName())
                .claim("family_name", request.familyName())
                .claim("name", request.displayName());
        if (request.superAdmin()) {
            claims.claim("super_admin", true);
            claims.claim("roles", List.of("SUPER_ADMIN"));
        } else {
            claims.claim("roles", List.of(request.role()));
        }
        return new NimbusJwtEncoder(new ImmutableSecret<>(key))
                .encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims.build()))
                .getTokenValue();
    }
}
