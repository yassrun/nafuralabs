package ma.nafura.erp.onboarding.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Decodes onboarding dev HS256 tokens before the OAuth2 Bearer filter (which may use Keycloak JWK only).
 */
public class DevOnboardingJwtFilter extends OncePerRequestFilter {

    private final JwtDecoder jwtDecoder;

    public DevOnboardingJwtFilter(JwtDecoder jwtDecoder) {
        this.jwtDecoder = jwtDecoder;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain chain
    ) throws ServletException, IOException {
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            String header = request.getHeader("Authorization");
            if (header != null && header.startsWith("Bearer ")) {
                String token = header.substring(7).trim();
                try {
                    var jwt = jwtDecoder.decode(token);
                    JwtAuthenticationToken authentication = new JwtAuthenticationToken(jwt);
                    authentication.setAuthenticated(true);
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                } catch (Exception ignored) {
                    // Bearer filter / Keycloak may handle other token types
                }
            }
        }
        chain.doFilter(request, response);
    }
}
