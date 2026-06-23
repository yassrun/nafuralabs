package ma.nafura.platform.ai.agent.service.tool;

import ma.nafura.platform.ai.agent.service.AgentExecutionContext;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

@Component
public class NavigateAgentTool implements AgentTool {

    private final Map<String, String> knownTargets;

    public NavigateAgentTool() {
        this.knownTargets = buildKnownTargets();
    }

    @Override
    public String key() {
        return "navigate";
    }

    @Override
    public AgentToolResult execute(AgentToolRequest request, AgentExecutionContext context) {
        // No permission check: navigation resolution is available to all (GAP 16-B)

        Map<String, Object> args = request.getArguments() != null ? request.getArguments() : Map.of();

        String target = trimToNull((String) args.get("target"));
        String entityType = trimToNull((String) args.get("entityType"));
        String entityId = trimToNull((String) args.get("entityId"));

        String route = resolveRoute(target, entityType, entityId);
        boolean navigated = route != null;

        return AgentToolResult.builder()
            .success(navigated)
            .message(navigated ? "Navigation target resolved" : "Navigation target not found")
            .payload(Map.of(
                "route", Objects.requireNonNullElse(route, ""),
                "label", buildLabel(target, entityType),
                "navigated", navigated
            ))
            .build();
    }

    private String resolveRoute(String target, String entityType, String entityId) {
        if (entityType != null && entityId != null) {
            if ("invoice".equalsIgnoreCase(entityType)) {
                return "/finance/invoices/" + entityId;
            }
            if ("partner".equalsIgnoreCase(entityType)) {
                return "/directory/partners/" + entityId;
            }
            if ("approval".equalsIgnoreCase(entityType)) {
                return "/approvals";
            }
            if ("notification".equalsIgnoreCase(entityType)) {
                return "/notifications";
            }
            return "/" + entityType.toLowerCase(Locale.ROOT) + "s/" + entityId;
        }

        if (target == null) {
            return null;
        }

        String normalized = target.toLowerCase(Locale.ROOT);
        for (Map.Entry<String, String> entry : knownTargets.entrySet()) {
            if (normalized.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        return null;
    }

    private Map<String, String> buildKnownTargets() {
        Map<String, String> map = new LinkedHashMap<>();
        map.put("dashboard", "/dashboard");
        map.put("home", "/dashboard");
        map.put("invoices", "/finance/invoices");
        map.put("invoice", "/finance/invoices");
        map.put("partners", "/directory/partners");
        map.put("partner", "/directory/partners");
        map.put("workflows", "/administration/workflows");
        map.put("workflow", "/administration/workflows");
        map.put("approvals", "/approvals");
        map.put("approval", "/approvals");
        map.put("notifications", "/notifications");
        map.put("settings", "/administration/settings");
        map.put("app settings", "/administration/settings");
        map.put("user settings", "/user-settings");
        map.put("members", "/administration/members");
        map.put("roles", "/administration/roles");
        map.put("webhooks", "/administration/webhooks");
        map.put("api keys", "/administration/api-keys");
        map.put("api-keys", "/administration/api-keys");
        map.put("numbering", "/administration/numbering-sequences");
        map.put("scheduled jobs", "/administration/scheduled-jobs");
        return map;
    }

    private String buildLabel(String target, String entityType) {
        if (target != null) {
            return target;
        }
        if (entityType != null) {
            return capitalize(entityType);
        }
        return "";
    }

    private String capitalize(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String lower = value.toLowerCase(Locale.ROOT);
        return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}

