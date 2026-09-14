package ma.nafura.sektor.ai;

import java.util.List;
import java.util.Optional;
import ma.nafura.platform.ai.agent.service.navigation.NavigationRegistry;
import ma.nafura.platform.ai.agent.service.navigation.NavigationTarget;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SektorNavigationRegistry implements NavigationRegistry {

    private final SektorScreenCatalog catalog;

    public SektorNavigationRegistry(SektorScreenCatalog catalog) {
        this.catalog = catalog;
    }

    @Override
    public List<NavigationTarget> all() {
        return catalog.screens().stream().map(this::toTarget).toList();
    }

    @Override
    public Optional<NavigationTarget> resolve(String target, String entityType, String entityId) {
        if (entityType != null && !entityType.isBlank()) {
            Optional<NavigationTarget> byType = bestMatch(ScreenCatalogScoring.fold(entityType));
            if (byType.isPresent()) {
                return byType;
            }
        }
        if (target == null || target.isBlank()) {
            return Optional.empty();
        }
        return bestMatch(ScreenCatalogScoring.fold(target));
    }

    private Optional<NavigationTarget> bestMatch(String foldedQuery) {
        ScreenCatalogEntry best = null;
        int bestScore = 0;
        for (ScreenCatalogEntry entry : catalog.screens()) {
            int score = ScreenCatalogScoring.score(entry, foldedQuery);
            if (score > bestScore) {
                bestScore = score;
                best = entry;
            }
        }
        return best == null ? Optional.empty() : Optional.of(toTarget(best));
    }

    private NavigationTarget toTarget(ScreenCatalogEntry entry) {
        String entityType = entry.getId() != null
                ? entry.getId().substring(entry.getId().lastIndexOf('.') + 1)
                : null;
        return NavigationTarget.builder()
                .keywords(entry.getKeywords())
                .route(entry.getRoute())
                .label(entry.getLabel())
                .permissionKey(entry.getPermissionKey())
                .entityType(entityType)
                .createRoute(entry.getCreateRoute())
                .detailRoute(entry.getDetailRoute())
                .help(entry.getHelp())
                .build();
    }
}
