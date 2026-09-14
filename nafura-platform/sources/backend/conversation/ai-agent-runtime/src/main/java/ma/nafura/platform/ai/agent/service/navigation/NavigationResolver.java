package ma.nafura.platform.ai.agent.service.navigation;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;
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
        return resolve(target, entityType, entityId, null);
    }

    public Optional<NavigationTarget> resolve(
            String target,
            String entityType,
            String entityId,
            String operation
    ) {
        Optional<NavigationTarget> resolved = Optional.empty();
        for (NavigationRegistry registry : registries) {
            Optional<NavigationTarget> candidate = registry.resolve(target, entityType, entityId);
            if (candidate.isPresent() && isAllowed(candidate.get())) {
                resolved = candidate;
                break;
            }
        }

        if (resolved.isEmpty() && target != null) {
            resolved = bestKeywordMatch(fold(target)).filter(this::isAllowed);
        }

        return resolved.map(base -> specialize(base, target, entityId, operation));
    }

    public Optional<NavigationTarget> inferFromRoute(String currentRoute) {
        if (currentRoute == null || currentRoute.isBlank()) {
            return Optional.empty();
        }
        String path = currentRoute.split("\\?")[0].trim();
        return all().stream()
                .filter(this::isAllowed)
                .filter(entry -> entry.getRoute() != null && !entry.getRoute().isBlank())
                .filter(entry -> path.equals(entry.getRoute()) || path.startsWith(entry.getRoute() + "/"))
                .max(Comparator.comparingInt(entry -> entry.getRoute().length()));
    }

    public String buildLlmContext() {
        StringBuilder sb = new StringBuilder();
        sb.append("AVAILABLE SCREENS (use navigate / help — do not invent URLs):\n");
        for (NavigationTarget target : all()) {
            if (!isAllowed(target) || target.getRoute() == null || target.getRoute().isBlank()) {
                continue;
            }
            sb.append("- ").append(target.getLabel() != null ? target.getLabel() : target.getRoute());
            sb.append(" | list=").append(target.getRoute());
            if (target.getCreateRoute() != null && !target.getCreateRoute().isBlank()) {
                sb.append(" | create=").append(target.getCreateRoute());
            }
            if (target.getKeywords() != null && !target.getKeywords().isEmpty()) {
                sb.append(" | keywords=").append(String.join(", ", target.getKeywords()));
            }
            sb.append('\n');
        }
        return sb.toString();
    }

    private Optional<NavigationTarget> bestKeywordMatch(String normalized) {
        NavigationTarget best = null;
        int bestScore = 0;
        for (NavigationTarget entry : all()) {
            if (entry.getKeywords() == null) {
                continue;
            }
            int score = 0;
            for (String keyword : entry.getKeywords()) {
                if (keyword == null) {
                    continue;
                }
                String folded = fold(keyword);
                if (!folded.isEmpty() && normalized.contains(folded)) {
                    score += folded.length();
                }
            }
            if (entry.getRoute() != null && entry.getRoute().contains("/etudes/dossiers")
                    && FAIRE_ETUDE.matcher(normalized).find()) {
                score += 24;
            }
            if (score > bestScore) {
                bestScore = score;
                best = entry;
            }
        }
        return Optional.ofNullable(best);
    }

    private static final Pattern FAIRE_ETUDE = Pattern.compile("\\bfaire\\b.{0,32}\\betude");

    private static String fold(String value) {
        if (value == null) {
            return "";
        }
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT);
    }

    private NavigationTarget specialize(
            NavigationTarget base,
            String target,
            String entityId,
            String operation
    ) {
        String op = operation != null ? operation.trim().toLowerCase(Locale.ROOT) : "";
        boolean wantsCreate = "create".equals(op) || "new".equals(op) || looksLikeCreate(target);
        if (entityId != null && !entityId.isBlank() && base.getDetailRoute() != null) {
            String detail = base.getDetailRoute().replace("{id}", entityId.trim());
            return copyWithRoute(base, detail);
        }
        if (wantsCreate && base.getCreateRoute() != null && !base.getCreateRoute().isBlank()) {
            return copyWithRoute(base, base.getCreateRoute());
        }
        return base;
    }

    private NavigationTarget copyWithRoute(NavigationTarget base, String route) {
        return NavigationTarget.builder()
                .keywords(base.getKeywords())
                .route(route)
                .label(base.getLabel())
                .permissionKey(base.getPermissionKey())
                .entityType(base.getEntityType())
                .createRoute(base.getCreateRoute())
                .detailRoute(base.getDetailRoute())
                .help(base.getHelp())
                .build();
    }

    public static boolean looksLikeCreate(String target) {
        if (target == null || target.isBlank()) {
            return false;
        }
        String normalized = target.toLowerCase(Locale.ROOT);
        return CREATE_HINT.matcher(normalized).find();
    }

    private static final Pattern CREATE_HINT = Pattern.compile(
            "\\b(ajoute[rz]?|cr[eé]e[rz]?|créer|create|add|nouveau(?:lle)?s?|new)\\b",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE | Pattern.UNICODE_CHARACTER_CLASS
    );

    private boolean isAllowed(NavigationTarget target) {
        String permissionKey = target.getPermissionKey();
        if (permissionKey == null || permissionKey.isBlank()) {
            return true;
        }
        return UserContext.isSuperAdmin() || UserContext.hasPermission(permissionKey);
    }
}
