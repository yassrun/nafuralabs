package ma.nafura.platform.authorization.security.jwt;

import org.springframework.security.oauth2.jwt.Jwt;

import java.util.List;

/**
 * Normalizes IdP-specific JWT claims into a stable platform view.
 * Default implementation understands Keycloak ({@code realm_access}) plus
 * common OIDC claims ({@code email}, {@code given_name}, …).
 */
public interface JwtClaimMapper {

    String email(Jwt jwt);

    String givenName(Jwt jwt);

    String familyName(Jwt jwt);

    String displayName(Jwt jwt);

    List<String> roles(Jwt jwt);

    boolean isSuperAdmin(Jwt jwt);
}
