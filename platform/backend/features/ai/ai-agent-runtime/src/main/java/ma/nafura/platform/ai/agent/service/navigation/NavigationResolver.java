package ma.nafura.platform.ai.agent.service.navigation;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import ma.nafura.platform.framework.context.UserContext;
import org.springframework.stereotype.Component;

/**
 * Resolves navigation targets from all registered {@link NavigationRegistry} beans.
 */
@Component
public class NavigationResolver {

    private final List<NavigationRegistry> registries;

    public NavigationResolver(List<NavigationRegistry> registries) {
        this.registries = registries != null ? registries : List.of();
    }

    public List<NavigationTarget> all() {
        List<NavigationTarget> targets = new ArrayList<>();
        for (NavigationRegistry registry : registries) {
            targets.addAll(registry.all());
        }
        return targets;
    }

    public Optional<NavigationTarget> resolve(String target, String entityType, String entityId) {
        for (NavigationRegistry registry : registries) {
            Optional<NavigationTarget> resolved = registry.resolve(target, entityType, entityId);
            if (resolved.isPresent()) {
                NavigationTarget candidate = resolved.get();
                if (isAllowed(candidate)) {
                    return resolved;
                }
            }
        }

        if (target == null) {
            return Optional.empty();
        }

        String normalized = target.toLowerCase(Locale.ROOT);
        return all().stream()
                .filter(entry -> entry.getKeywords() != null && entry.getKeywords().stream()
                        .anyMatch(keyword -> normalized.contains(keyword.toLowerCase(Locale.ROOT))))
                .filter(this::isAllowed)
                .findFirst();
    }

    private boolean isAllowed(NavigationTarget target) {
        String permissionKey = target.getPermissionKey();
        if (permissionKey == null || permissionKey.isBlank()) {
            return true;
        }
        return UserContext.isSuperAdmin() || UserContext.hasPermission(permissionKey);
    }
}
