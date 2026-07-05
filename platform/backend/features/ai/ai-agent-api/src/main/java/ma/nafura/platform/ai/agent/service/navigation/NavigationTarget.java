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
}
