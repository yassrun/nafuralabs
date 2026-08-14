package ma.nafura.platform.authorization.security.authorization;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.method.HandlerMethod;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.servlet.mvc.condition.PathPatternsRequestCondition;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.util.*;

/**
 * Discovers and matches controller endpoints annotated with {@link PublicEndpoint}.
 *
 * <p>This is used as a single source of truth for application-level public endpoints.
 */
@Slf4j
@Component
public class PublicEndpointRegistry {

    private final RequestMappingHandlerMapping handlerMapping;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    public PublicEndpointRegistry(
            @Qualifier("requestMappingHandlerMapping") RequestMappingHandlerMapping handlerMapping) {
        this.handlerMapping = handlerMapping;
    }

    public List<PublicEndpointRule> getRules() {
        List<PublicEndpointRule> rules = new ArrayList<>();

        for (Map.Entry<RequestMappingInfo, HandlerMethod> entry : handlerMapping.getHandlerMethods().entrySet()) {
            RequestMappingInfo mappingInfo = entry.getKey();
            HandlerMethod handlerMethod = entry.getValue();

            if (!handlerMethod.hasMethodAnnotation(PublicEndpoint.class)) {
                continue;
            }

            Set<String> patterns = extractPatterns(mappingInfo);
            if (patterns.isEmpty()) {
                continue;
            }

            Set<RequestMethod> methods = mappingInfo.getMethodsCondition().getMethods();
            rules.add(new PublicEndpointRule(patterns, methods));
        }

        return rules;
    }

    public boolean isPublic(HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();

        for (PublicEndpointRule rule : getRules()) {
            boolean methodMatch = rule.methods().isEmpty() ||
                    rule.methods().stream().anyMatch(m -> m.name().equalsIgnoreCase(method));

            if (!methodMatch) {
                continue;
            }

            boolean pathMatch = rule.patterns().stream().anyMatch(pattern -> pathMatcher.match(pattern, path));
            if (pathMatch) {
                return true;
            }
        }

        return false;
    }

    private Set<String> extractPatterns(RequestMappingInfo mappingInfo) {
        PathPatternsRequestCondition pathPatternsCondition = mappingInfo.getPathPatternsCondition();
        if (pathPatternsCondition != null) {
            return new LinkedHashSet<>(pathPatternsCondition.getPatternValues());
        }

        if (mappingInfo.getPatternsCondition() != null) {
            return new LinkedHashSet<>(mappingInfo.getPatternsCondition().getPatterns());
        }

        return Set.of();
    }

    public record PublicEndpointRule(Set<String> patterns, Set<RequestMethod> methods) {

        public List<HttpMethod> httpMethods() {
            if (methods.isEmpty()) {
                return List.of();
            }

            List<HttpMethod> result = new ArrayList<>(methods.size());
            for (RequestMethod method : methods) {
                result.add(HttpMethod.valueOf(method.name()));
            }
            return result;
        }
    }
}

