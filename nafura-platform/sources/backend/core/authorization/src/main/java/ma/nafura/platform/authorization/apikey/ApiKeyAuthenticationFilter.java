package ma.nafura.platform.authorization.apikey;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.HashSet;
import java.util.Set;

@Slf4j
@Order(0)
@RequiredArgsConstructor
public class ApiKeyAuthenticationFilter extends OncePerRequestFilter {

    private static final String AUTHORIZATION = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String KEY_PREFIX = "nfk_";

    private final ApiKeyService apiKeyService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        try {
            String header = request.getHeader(AUTHORIZATION);
            if (header != null && header.startsWith(BEARER_PREFIX)) {
                String token = header.substring(BEARER_PREFIX.length()).trim();
                if (token.startsWith(KEY_PREFIX)) {
                    ApiKeyService.ApiKeyAuthenticationResult result = apiKeyService.authenticate(token);
                    if (result != null) {
                        TenantContext.setTenantId(result.tenantId());
                        Set<String> perms = new HashSet<>(result.permissions());
                        UserContext.setPermissions(perms);
                        UserContext.setUserRole("API_KEY");
                        UserContext.setSuperAdmin(false);

                        AbstractAuthenticationToken authentication = new AbstractAuthenticationToken(null) {
                            @Override
                            public Object getPrincipal() {
                                return "api-key:" + result.id();
                            }

                            @Override
                            public Object getCredentials() {
                                return "";
                            }
                        };
                        authentication.setAuthenticated(true);
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("API key authentication failed: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}

