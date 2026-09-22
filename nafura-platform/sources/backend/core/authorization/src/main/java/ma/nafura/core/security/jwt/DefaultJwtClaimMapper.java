package ma.nafura.platform.authorization.security.jwt;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Default claim mapping: OIDC standard claims + Keycloak {@code realm_access.roles}.
 */
public class DefaultJwtClaimMapper implements JwtClaimMapper {

    private static final String SUPER_ADMIN = "SUPER_ADMIN";
    private static final String SUPER_ADMIN_LOWER = "super_admin";

    @Override
    public String email(Jwt jwt) {
        return jwt.getClaimAsString("email");
    }

    @Override
    public String givenName(Jwt jwt) {
        return jwt.getClaimAsString("given_name");
    }

    @Override
    public String familyName(Jwt jwt) {
        return jwt.getClaimAsString("family_name");
    }

    @Override
    public String displayName(Jwt jwt) {
        String name = jwt.getClaimAsString("name");
        if (StringUtils.hasText(name)) {
            return name.trim();
        }
        String given = givenName(jwt);
        String family = familyName(jwt);
        String combined = ((given != null ? given : "") + " " + (family != null ? family : "")).trim();
        if (StringUtils.hasText(combined)) {
            return combined;
        }
        String email = email(jwt);
        return email != null ? email : "";
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<String> roles(Jwt jwt) {
        Object realmAccess = jwt.getClaim("realm_access");
        if (realmAccess instanceof Map<?, ?> map) {
            Object roles = map.get("roles");
            if (roles instanceof List<?> roleList) {
                return roleList.stream()
                        .filter(String.class::isInstance)
                        .map(String.class::cast)
                        .toList();
            }
        }
        Object rolesClaim = jwt.getClaim("roles");
        if (rolesClaim instanceof List<?> roleList) {
            return roleList.stream()
                    .filter(String.class::isInstance)
                    .map(String.class::cast)
                    .toList();
        }
        return Collections.emptyList();
    }

    @Override
    public boolean isSuperAdmin(Jwt jwt) {
        Boolean claim = jwt.getClaimAsBoolean("super_admin");
        if (claim != null && claim) {
            return true;
        }
        List<String> roles = roles(jwt);
        return roles.contains(SUPER_ADMIN) || roles.contains(SUPER_ADMIN_LOWER);
    }
}
