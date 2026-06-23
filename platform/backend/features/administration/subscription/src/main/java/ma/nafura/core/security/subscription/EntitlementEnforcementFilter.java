package ma.nafura.platform.subscription.security.subscription;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.subscription.domain.model.SubscriptionAssignmentOwnerType;
import ma.nafura.platform.subscription.service.SubscriptionEntitlementService;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.springframework.beans.factory.annotation.Value;
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
 * Enforces endpoint-level subscription entitlements after authentication and RBAC.
 */
@Slf4j
@Order(4) // after user(1), tenant(2), permission(3)
@RequiredArgsConstructor
public class EntitlementEnforcementFilter extends OncePerRequestFilter {

    private final List<HandlerMapping> handlerMappings;
    private final SubscriptionEntitlementService subscriptionEntitlementService;

    @Value("${nafura.application.id:app}")
    private String applicationId;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        HandlerMethod handlerMethod = findHandlerMethod(request);
        if (handlerMethod == null) {
            filterChain.doFilter(request, response);
            return;
        }

        RequireEntitlement requireEntitlement = resolveAnnotation(handlerMethod);
        if (requireEntitlement == null) {
            filterChain.doFilter(request, response);
            return;
        }

        if (requireEntitlement.allowSuperAdmin() && UserContext.isSuperAdmin()) {
            filterChain.doFilter(request, response);
            return;
        }

        OwnerContext ownerContext = resolveOwnerContext(requireEntitlement.owner());
        if (ownerContext == null) {
            writeError(
                    response,
                    HttpServletResponse.SC_UNAUTHORIZED,
                    "subscription_owner_unresolved",
                    "Unable to resolve subscription owner context for entitlement check");
            return;
        }

        String entitlementKey = requireEntitlement.value();
        boolean entitled = subscriptionEntitlementService.isEntitled(
                resolveApplicationId(),
                ownerContext.ownerType(),
                ownerContext.ownerId(),
                entitlementKey
        );

        if (!entitled) {
            writeError(
                    response,
                    HttpServletResponse.SC_FORBIDDEN,
                    "plan_restricted",
                    "Entitlement denied: " + entitlementKey);
            return;
        }

        filterChain.doFilter(request, response);
    }

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

    private RequireEntitlement resolveAnnotation(HandlerMethod handlerMethod) {
        Method method = handlerMethod.getMethod();
        RequireEntitlement methodAnnotation = method.getAnnotation(RequireEntitlement.class);
        if (methodAnnotation != null) {
            return methodAnnotation;
        }
        return handlerMethod.getBeanType().getAnnotation(RequireEntitlement.class);
    }

    private OwnerContext resolveOwnerContext(EntitlementOwner owner) {
        UUID tenantId = TenantContext.getTenantIdOrNull();
        UUID userId = UserContext.getUserIdOrNull();

        return switch (owner) {
            case TENANT -> tenantId != null
                    ? new OwnerContext(SubscriptionAssignmentOwnerType.TENANT, tenantId)
                    : null;
            case USER -> userId != null
                    ? new OwnerContext(SubscriptionAssignmentOwnerType.USER, userId)
                    : null;
            case AUTO -> {
                if (tenantId != null) {
                    yield new OwnerContext(SubscriptionAssignmentOwnerType.TENANT, tenantId);
                }
                if (userId != null) {
                    yield new OwnerContext(SubscriptionAssignmentOwnerType.USER, userId);
                }
                yield null;
            }
        };
    }

    private void writeError(HttpServletResponse response, int status, String code, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write(String.format(
                "{\"error\":\"%s\",\"code\":\"%s\",\"message\":\"%s\",\"status\":%d}",
                status == 403 ? "Forbidden" : "Unauthorized",
                code,
                message.replace("\"", "\\\""),
                status
        ));
    }

    private String resolveApplicationId() {
        if (applicationId == null || applicationId.isBlank()) {
            return "app";
        }
        return applicationId.trim().toLowerCase();
    }

    private record OwnerContext(SubscriptionAssignmentOwnerType ownerType, UUID ownerId) {}
}


