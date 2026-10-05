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

import java.io.InputStream;
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
            Set<String> opened = new LinkedHashSet<>();
            for (String pattern : patterns) {
                if (methods.isEmpty()) {
                    if (surface().opened("GET", pattern)) opened.add(pattern);
                } else if (methods.stream().anyMatch(method -> surface().opened(method.name(), pattern))) {
                    opened.add(pattern);
                }
            }
            if (!opened.isEmpty()) {
                rules.add(new PublicEndpointRule(opened, methods));
            }
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

            boolean pathMatch = rule.patterns().stream()
                    .anyMatch(pattern -> pathMatcher.match(pattern, path) && surface().opened(method, pattern));
            if (pathMatch) {
                return true;
            }
        }

        return false;
    }

    /**
     * A business-context path {@code /api/public/<bc>/} is open only when that context's manifest lists it.
     * Platform paths (lab, invitations) are not business-context paths and stay as declared on the method.
     */
    private PublicSurface surface() {
        PublicSurface loaded = surface;
        if (loaded == null) {
            loaded = PublicSurface.load();
            surface = loaded;
        }
        return loaded;
    }

    private volatile PublicSurface surface;

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

    /** Declarations from {@code META-INF/nafura/bc/*.json} {@code spec.public}. */
    record PublicSurface(Set<String> businessContexts, Set<String> endpoints) {

        static PublicSurface load() {
            Set<String> contexts = new LinkedHashSet<>();
            Set<String> endpoints = new LinkedHashSet<>();
            try {
                var resolver = new org.springframework.core.io.support.PathMatchingResourcePatternResolver();
                var mapper = tools.jackson.databind.json.JsonMapper.builder().build();
                for (var resource : resolver.getResources("classpath*:META-INF/nafura/bc/*.json")) {
                    try (InputStream in = resource.getInputStream()) {
                        var root = mapper.readTree(in);
                        String id = root.path("metadata").path("id").asText("");
                        if (id.startsWith("bc.")) {
                            contexts.add(id.substring(3));
                        }
                        var spec = root.path("spec").path("public");
                        add(endpoints, spec.path("endpoints"));
                        add(endpoints, spec.path("submissions"));
                    }
                }
            } catch (Exception e) {
                log.warn("Public surface not loaded: {}", e.getMessage());
            }
            return new PublicSurface(contexts, endpoints);
        }

        private static void add(Set<String> endpoints, tools.jackson.databind.JsonNode array) {
            if (array == null || !array.isArray()) return;
            array.forEach(node -> endpoints.add(node.asText()));
        }

        boolean opened(String method, String pattern) {
            String context = contextOf(pattern);
            if (context == null || !businessContexts.contains(context)) {
                return true;
            }
            String declared = method.toUpperCase(Locale.ROOT) + " " + pattern;
            return endpoints.contains(declared);
        }

        private static String contextOf(String pattern) {
            String prefix = "/api/public/";
            if (pattern == null || !pattern.startsWith(prefix)) return null;
            String rest = pattern.substring(prefix.length());
            int slash = rest.indexOf('/');
            if (slash <= 0) return null;
            return rest.substring(0, slash);
        }
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

