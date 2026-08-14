package ma.nafura.platform.authorization.security.config;

import jakarta.servlet.http.HttpServletRequest;
import ma.nafura.platform.authorization.security.authorization.PublicEndpointRegistry;
import ma.nafura.platform.authorization.security.properties.SecurityProperties;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.util.AntPathMatcher;

/**
 * Ignores Bearer tokens on public routes so invalid/expired JWTs do not cause 401
 * on {@code permitAll} endpoints (e.g. onboarding signup).
 */
public class PublicAwareBearerTokenResolver implements BearerTokenResolver {

    private final PublicEndpointRegistry publicEndpointRegistry;
    private final SecurityProperties securityProperties;
    private final DefaultBearerTokenResolver delegate = new DefaultBearerTokenResolver();
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    public PublicAwareBearerTokenResolver(
            PublicEndpointRegistry publicEndpointRegistry,
            SecurityProperties securityProperties) {
        this.publicEndpointRegistry = publicEndpointRegistry;
        this.securityProperties = securityProperties;
    }

    @Override
    public String resolve(HttpServletRequest request) {
        if (isPublic(request)) {
            return null;
        }
        return delegate.resolve(request);
    }

    private boolean isPublic(HttpServletRequest request) {
        if (publicEndpointRegistry.isPublic(request)) {
            return true;
        }
        String path = request.getRequestURI();
        for (String pattern : securityProperties.getPublicEndpoints()) {
            if (pathMatcher.match(pattern, path)) {
                return true;
            }
        }
        return false;
    }
}
