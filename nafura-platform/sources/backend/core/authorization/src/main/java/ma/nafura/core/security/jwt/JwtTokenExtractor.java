package ma.nafura.platform.authorization.security.jwt;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Utility class for extracting information from JWT tokens.
 * Provides methods to safely extract claims from the current security context.
 */
@Slf4j
@RequiredArgsConstructor
public class JwtTokenExtractor {

    private final JwtClaimMapper claimMapper;
    
    /**
     * Get the current JWT from the security context.
     * 
     * @return Optional containing the JWT if present and valid
     */
    public Optional<Jwt> getCurrentJwt() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            return Optional.of(jwt);
        }
        return Optional.empty();
    }
    
    /**
     * Extract email from the current JWT.
     * 
     * @return Optional containing the email if present
     */
    public Optional<String> getEmail() {
        return getCurrentJwt()
                .map(claimMapper::email);
    }
    
    /**
     * Extract subject (usually user ID) from the current JWT.
     * 
     * @return Optional containing the subject if present
     */
    public Optional<String> getSubject() {
        return getCurrentJwt()
                .map(Jwt::getSubject);
    }
    
    /**
     * Extract name from the current JWT.
     * Tries 'name' first, then falls back to 'given_name' + 'family_name'.
     * 
     * @return Optional containing the name if present
     */
    public Optional<String> getName() {
        return getCurrentJwt()
                .map(claimMapper::displayName)
                .filter(name -> name != null && !name.isBlank());
    }
    
    /**
     * Extract a specific string claim from the current JWT.
     * 
     * @param claimName the name of the claim to extract
     * @return Optional containing the claim value if present
     */
    public Optional<String> getClaim(String claimName) {
        return getCurrentJwt()
                .map(jwt -> jwt.getClaimAsString(claimName));
    }
    
    /**
     * Extract a specific claim as a list from the current JWT.
     * 
     * @param claimName the name of the claim to extract
     * @return List of claim values, or empty list if not present
     */
    @SuppressWarnings("unchecked")
    public List<String> getClaimAsList(String claimName) {
        return getCurrentJwt()
                .map(jwt -> {
                    Object claim = jwt.getClaim(claimName);
                    if (claim instanceof List) {
                        return (List<String>) claim;
                    }
                    return Collections.<String>emptyList();
                })
                .orElse(Collections.emptyList());
    }
    
    /**
     * Extract all claims from the current JWT.
     * 
     * @return Map of all claims, or empty map if no JWT present
     */
    public Map<String, Object> getAllClaims() {
        return getCurrentJwt()
                .map(Jwt::getClaims)
                .orElse(Collections.emptyMap());
    }
    
    /**
     * Check if the current user is authenticated with a valid JWT.
     * 
     * @return true if authenticated with JWT, false otherwise
     */
    public boolean isAuthenticated() {
        return getCurrentJwt().isPresent();
    }
    
    /**
     * Get the issuer from the current JWT.
     * 
     * @return Optional containing the issuer URL if present
     */
    public Optional<String> getIssuer() {
        return getCurrentJwt()
                .map(jwt -> {
                    var issuer = jwt.getIssuer();
                    return issuer != null ? issuer.toString() : null;
                });
    }
    
    /**
     * Get the audience from the current JWT.
     * 
     * @return List of audiences, or empty list if not present
     */
    public List<String> getAudience() {
        return getCurrentJwt()
                .map(Jwt::getAudience)
                .orElse(Collections.emptyList());
    }

    /**
     * Extract roles via {@link JwtClaimMapper} (Keycloak {@code realm_access} by default).
     *
     * @return List of roles, or empty list if not present
     */
    public List<String> getRealmRoles() {
        return getCurrentJwt()
                .map(claimMapper::roles)
                .orElse(Collections.emptyList());
    }

    public JwtClaimMapper claimMapper() {
        return claimMapper;
    }
}
