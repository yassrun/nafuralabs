package ma.nafura.platform.ai.agent.service.navigation;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.springframework.stereotype.Component;

/**
 * Platform-level admin navigation targets (product-agnostic).
 */
@Component
public class PlatformAdminNavigationRegistry implements NavigationRegistry {

    @Override
    public List<NavigationTarget> all() {
        return List.of(
                target(List.of("dashboard", "home", "accueil"), "/dashboard", "Dashboard", null, null),
                target(List.of("approvals", "approval", "approbations"), "/approvals", "Approvals", null, "approval"),
                target(List.of("notifications", "notification"), "/notifications", "Notifications", null, null),
                target(List.of("settings", "app settings", "paramètres"), "/administration/settings", "App Settings", "administration.settings.read", null),
                target(List.of("user settings", "profile"), "/user-settings", "User Settings", null, null),
                target(List.of("members", "member", "équipe"), "/administration/members", "Members", "administration.members.read", "member"),
                target(List.of("roles", "role"), "/administration/roles", "Roles", "administration.roles.read", null),
                target(List.of("webhooks", "webhook"), "/administration/webhooks", "Webhooks", "administration.webhooks.read", null),
                target(List.of("api keys", "api-keys", "apikey"), "/administration/api-keys", "API Keys", "administration.api-keys.read", "api-key"),
                target(List.of("workflows", "workflow"), "/administration/workflows", "Workflows", "administration.workflows.read", null),
                target(List.of("numbering", "numérotation"), "/administration/numbering-sequences", "Numbering", "administration.numbering-sequences.read", null),
                target(List.of("scheduled jobs", "jobs"), "/administration/scheduled-jobs", "Scheduled Jobs", "administration.scheduled-jobs.read", null)
        );
    }

    @Override
    public Optional<NavigationTarget> resolve(String target, String entityType, String entityId) {
        if (entityType != null && entityId != null) {
            return all().stream()
                    .filter(t -> t.getEntityType() != null && t.getEntityType().equalsIgnoreCase(entityType))
                    .findFirst()
                    .map(base -> NavigationTarget.builder()
                            .keywords(base.getKeywords())
                            .route(base.getRoute().replaceAll("/$", "") + "/" + entityId)
                            .label(base.getLabel())
                            .permissionKey(base.getPermissionKey())
                            .entityType(base.getEntityType())
                            .build());
        }
        if (target == null) {
            return Optional.empty();
        }
        String normalized = target.toLowerCase(Locale.ROOT);
        return all().stream()
                .filter(entry -> entry.getKeywords().stream()
                        .anyMatch(keyword -> normalized.contains(keyword.toLowerCase(Locale.ROOT))))
                .findFirst();
    }

    private NavigationTarget target(
            List<String> keywords,
            String route,
            String label,
            String permissionKey,
            String entityType
    ) {
        return NavigationTarget.builder()
                .keywords(keywords)
                .route(route)
                .label(label)
                .permissionKey(permissionKey)
                .entityType(entityType)
                .build();
    }
}
