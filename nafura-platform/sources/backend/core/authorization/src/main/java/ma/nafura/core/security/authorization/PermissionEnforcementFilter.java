package ma.nafura.platform.authorization.security.authorization;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.platform.framework.record.RecordAccess;
import ma.nafura.platform.tenancy.repository.TenantDomainRepository;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.annotation.Order;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerExecutionChain;
import org.springframework.web.servlet.HandlerMapping;

import java.io.IOException;
import java.lang.reflect.Method;
import java.util.List;
import java.util.UUID;

/**
 * Filter that enforces permission checks based on @SecuredResource annotations.
 * 
 * <p>This filter runs after UserContextFilter/TenantContextFilter and checks:
 * <ol>
 *   <li>If the controller has @SecuredResource annotation</li>
 *   <li>If the method has @PublicEndpoint (skip check)</li>
 *   <li>If the method has @RequirePermission (use specified permission)</li>
 *   <li>Otherwise, derive permission from HTTP method</li>
 * </ol>
 * 
 * <p>Permission string format:
 * <ul>
 *   <li>Preferred: {domain}.{feature}.{resource}.{action}</li>
 *   <li>Legacy fallback: {module}.{resource}.{action}</li>
 * </ul>
 * 
 * @see SecuredResource
 * @see RequirePermission
 * @see PublicEndpoint
 */
@Slf4j
@Order(3) // Execute after UserContextFilter (1) and TenantContextFilter (2)
@RequiredArgsConstructor
public class PermissionEnforcementFilter extends OncePerRequestFilter {
    
    private final List<HandlerMapping> handlerMappings;
    private final ObjectProvider<TenantDomainRepository> tenantDomains;
    private final ObjectProvider<RecordAccess> recordAccess;
    
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        
        HandlerMethod handlerMethod;
        try {
            // Find the handler for this request
            handlerMethod = findHandlerMethod(request);
            
            if (handlerMethod == null) {
                // No handler found - let Spring handle it (404)
                filterChain.doFilter(request, response);
                return;
            }
            
            // Check if controller has @SecuredResource
            SecuredResource securedResource = handlerMethod.getBeanType().getAnnotation(SecuredResource.class);
            Method method = handlerMethod.getMethod();
            RequirePermission methodPermission = method.getAnnotation(RequirePermission.class);

            if (securedResource == null && methodPermission == null) {
                // Controller not secured - allow through
                log.debug("Controller {} has no @SecuredResource annotation, skipping permission check",
                        handlerMethod.getBeanType().getSimpleName());
                filterChain.doFilter(request, response);
                return;
            }
            
            // Check for @PublicEndpoint
            if (method.isAnnotationPresent(PublicEndpoint.class)) {
                PublicEndpoint publicEndpoint = method.getAnnotation(PublicEndpoint.class);
                log.debug("Method {} is marked as @PublicEndpoint (reason: {}), skipping permission check",
                        method.getName(), publicEndpoint.reason());
                filterChain.doFilter(request, response);
                return;
            }

            if (method.isAnnotationPresent(HostRecordGate.class)) {
                String entity = entityType(request);
                RecordAccess access = recordAccess.getIfAvailable();
                if (access != null && access.known(entity)) {
                    filterChain.doFilter(request, response);
                    return;
                }
            }
            
            // Without @SecuredResource there is no scope: @RequirePermission names the whole permission.
            String requiredPermission = securedResource == null
                    ? methodPermission.value()
                    : buildPermission(securedResource, method, request.getMethod());
            
            log.debug("Checking permission: {} for {}:{}", 
                    requiredPermission, 
                    handlerMethod.getBeanType().getSimpleName(), 
                    method.getName());
            
            // Check if user has the permission
            if (isDomainDisabled(requiredPermission)) {
                log.warn("Domain disabled for tenant: {} for user {}", requiredPermission, UserContext.getUserEmail());
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write(String.format(
                        "{\"error\":\"Forbidden\",\"message\":\"Domain disabled: %s\",\"status\":403}",
                        domainOf(requiredPermission)
                ));
                return;
            }
            if (!UserContext.hasPermission(requiredPermission)) {
                log.warn("Permission denied: {} for user {} (role: {})", 
                        requiredPermission,
                        UserContext.getUserEmail(),
                        UserContext.getUserRole());
                
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write(String.format(
                        "{\"error\":\"Forbidden\",\"message\":\"Permission denied: %s\",\"status\":403}",
                        requiredPermission
                ));
                return;
            }
            
            log.debug("Permission granted: {}", requiredPermission);
        } catch (Exception e) {
            // Only mask failures while resolving/checking permission — never wrap
            // controller/downstream errors as "Permission enforcement failed".
            log.error("Error in permission enforcement filter, denying request", e);
            if (!response.isCommitted()) {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                response.setContentType("application/json");
                response.getWriter().write(
                        "{\"error\":\"Internal Server Error\",\"message\":\"Permission enforcement failed\",\"status\":500}"
                );
            }
            return;
        }

        filterChain.doFilter(request, response);
    }
    
    /**
     * A domain the tenant switched off refuses its API to everyone: the first segment of a permission
     * is the domain code (bc.demo → demo.notes.note.read).
     */
    private boolean isDomainDisabled(String permission) {
        UUID tenantId = TenantContext.getTenantIdOrNull();
        TenantDomainRepository domains = tenantDomains.getIfAvailable();
        if (tenantId == null || domains == null) {
            return false;
        }
        return domains.findByTenantIdAndDomainCode(tenantId, domainOf(permission))
                .map(row -> !"ACTIVE".equalsIgnoreCase(row.getStatus()))
                .orElse(false);
    }

    private static String domainOf(String permission) {
        int dot = permission.indexOf('.');
        return dot < 0 ? permission : permission.substring(0, dot);
    }

    private String entityType(HttpServletRequest request) {
        String param = request.getParameter("entityType");
        return param == null || param.isBlank() ? null : param;
    }

    /**
     * Find the handler method for the current request.
     */
    private HandlerMethod findHandlerMethod(HttpServletRequest request) {
        for (HandlerMapping handlerMapping : handlerMappings) {
            try {
                HandlerExecutionChain handler = handlerMapping.getHandler(request);
                if (handler != null && handler.getHandler() instanceof HandlerMethod handlerMethod) {
                    return handlerMethod;
                }
            } catch (Exception e) {
                log.trace("Handler mapping {} could not find handler: {}", 
                        handlerMapping.getClass().getSimpleName(), e.getMessage());
            }
        }
        return null;
    }
    
    /**
     * Build the permission string from annotations and HTTP method.
     */
    private String buildPermission(SecuredResource securedResource, Method method, String httpMethod) {
        String scope = resolvePermissionScope(securedResource);
        
        // Check for @RequirePermission override
        RequirePermission requirePermission = method.getAnnotation(RequirePermission.class);
        
        if (requirePermission != null) {
            if (requirePermission.fullPermission()) {
                // Full permission string provided
                return requirePermission.value();
            } else {
                // Action override
                return String.format("%s.%s", scope, requirePermission.value());
            }
        }
        
        // Derive action from HTTP method
        String action = mapHttpMethodToAction(httpMethod);
        return String.format("%s.%s", scope, action);
    }

    private String resolvePermissionScope(SecuredResource securedResource) {
        String domain = normalize(securedResource.domain());
        String feature = normalize(securedResource.feature());
        String module = normalize(securedResource.module());
        String resource = normalize(securedResource.resource());

        if (resource == null) {
            throw new IllegalStateException("@SecuredResource.resource must be non-empty");
        }

        if (domain != null || feature != null) {
            if (domain == null || feature == null) {
                throw new IllegalStateException(
                        "@SecuredResource requires both domain and feature when using CRUX-style permissions");
            }
            return String.format("%s.%s.%s", domain, feature, resource);
        }

        if (module != null) {
            return String.format("%s.%s", module, resource);
        }

        throw new IllegalStateException(
                "@SecuredResource requires either domain+feature (preferred) or legacy module");
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
    
    /**
     * Map HTTP method to permission action.
     */
    private String mapHttpMethodToAction(String httpMethod) {
        return switch (httpMethod.toUpperCase()) {
            case "GET" -> "read";
            case "POST" -> "create";
            case "PUT" -> "update";
            case "PATCH" -> "update";
            case "DELETE" -> "delete";
            default -> "read";
        };
    }
}


