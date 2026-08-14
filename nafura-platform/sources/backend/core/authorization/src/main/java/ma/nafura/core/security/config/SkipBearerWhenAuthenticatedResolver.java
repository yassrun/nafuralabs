package ma.nafura.platform.authorization.security.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;

/**
 * Prevents the OAuth2 Bearer filter from re-authenticating when a JWT is already in the context
 * (e.g. dev onboarding mock token installed by a servlet filter).
 */
public final class SkipBearerWhenAuthenticatedResolver implements BearerTokenResolver {

    private final BearerTokenResolver delegate;

    public SkipBearerWhenAuthenticatedResolver(BearerTokenResolver delegate) {
        this.delegate = delegate;
    }

    @Override
    public String resolve(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            return null;
        }
        return delegate.resolve(request);
    }
}
