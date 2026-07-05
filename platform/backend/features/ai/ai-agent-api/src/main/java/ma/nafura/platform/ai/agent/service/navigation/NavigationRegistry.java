package ma.nafura.platform.ai.agent.service.navigation;

import java.util.List;
import java.util.Optional;

/**
 * Product-provided mapping from natural-language targets to application routes.
 */
public interface NavigationRegistry {

    List<NavigationTarget> all();

    Optional<NavigationTarget> resolve(String target, String entityType, String entityId);
}
