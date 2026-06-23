package ma.nafura.platform.scope.security.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.scope.security.scope.DefaultScopeService;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.annotation.Order;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Applies a single resolved scope for non-multi tenancy modes.
 */
@Order(2)
@RequiredArgsConstructor
public class FixedScopeTenantContextFilter extends OncePerRequestFilter {

    private final TenantScopeProperties tenantScopeProperties;
    private final DefaultScopeService defaultScopeService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        if (!isFixedScopeMode() || shouldSkipTenantContext(request.getRequestURI())) {
            filterChain.doFilter(request, response);
            return;
        }

        UUID scopeId = defaultScopeService.resolveDefaultScopeId();
        try {
            TenantContext.setTenantId(scopeId);
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private boolean shouldSkipTenantContext(String path) {
        return tenantScopeProperties.getSkipPaths().stream()
                .anyMatch(skipPath -> {
                    if (skipPath.endsWith("/")) {
                        return path.startsWith(skipPath);
                    }
                    return path.equals(skipPath) || path.startsWith(skipPath + "/");
                });
    }

    private boolean isFixedScopeMode() {
        String mode = tenantScopeProperties.getMode();
        return "none".equalsIgnoreCase(mode) || "single".equalsIgnoreCase(mode);
    }
}


