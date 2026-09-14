package ma.nafura.platform.ai.agent.service.navigation;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NavigationTarget {
    private final List<String> keywords;
    private final String route;
    private final String label;
    /** RBAC permission required to expose this route; null = available to all authenticated users. */
    private final String permissionKey;
    private final String entityType;
    /** Anatomy create path when the product exposes one (e.g. /articles/new). */
    private final String createRoute;
    /** Detail pattern with {id}, e.g. /articles/{id}. */
    private final String detailRoute;
    /** One-line help used by the assistant catalog. */
    private final String help;
}
