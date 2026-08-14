package ma.nafura.platform.ai.agent.service.tool;

import java.util.ArrayList;
import ma.nafura.platform.ai.agent.service.AgentExecutionContext;
import ma.nafura.platform.framework.search.GlobalSearchResult;
import ma.nafura.platform.framework.search.GlobalSearchService;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Component
public class SearchAgentTool implements AgentTool {

    private final ObjectProvider<GlobalSearchService> globalSearchServiceProvider;
    private final AgentPermissionChecker permissionChecker;

    public SearchAgentTool(
            ObjectProvider<GlobalSearchService> globalSearchServiceProvider,
            AgentPermissionChecker permissionChecker
    ) {
        this.globalSearchServiceProvider = globalSearchServiceProvider;
        this.permissionChecker = permissionChecker;
    }

    @Override
    public String key() {
        return "search";
    }

    @Override
    public AgentToolResult execute(AgentToolRequest request, AgentExecutionContext context) {
        permissionChecker.checkRead(context, "platform", "search");

        Map<String, Object> args = request.getArguments() != null ? request.getArguments() : Map.of();

        String query = trimToNull((String) args.getOrDefault("query", ""));
        Object rawEntityTypes = args.get("entityTypes");
        int limit = parseLimit(args.get("limit"), 5);

        List<Map<String, Object>> results = new ArrayList<>();

        if (query == null || query.length() < 2) {
            return AgentToolResult.builder()
                .success(true)
                .message("Search executed with no results (empty or too short query)")
                .payload(Map.of(
                    "query", Objects.requireNonNullElse(query, ""),
                    "results", results,
                    "limit", limit
                ))
                .build();
        }

        GlobalSearchService globalSearchService = globalSearchServiceProvider.getIfAvailable();
        if (globalSearchService != null) {
            GlobalSearchService.SearchResponse response = globalSearchService.search(
                    query,
                    parseTenantId(context),
                    Math.max(1, Math.min(limit, 20))
            );
            for (GlobalSearchResult item : response.results()) {
                results.add(Map.of(
                        "id", item.id() != null ? item.id() : "",
                        "entityType", item.entityType() != null ? item.entityType() : "",
                        "title", item.title() != null ? item.title() : "",
                        "subtitle", item.subtitle() != null ? item.subtitle() : "",
                        "route", item.route() != null ? item.route() : "",
                        "icon", item.icon() != null ? item.icon() : "",
                        "score", item.score()
                ));
            }
        }

        return AgentToolResult.builder()
            .success(true)
            .message("Found " + results.size() + " result(s)")
            .payload(Map.of(
                "query", query,
                "entityTypes", rawEntityTypes != null ? rawEntityTypes : List.of(),
                "results", results,
                "limit", limit
            ))
            .build();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private int parseLimit(Object value, int defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        if (value instanceof Number number) {
            int asInt = number.intValue();
            return asInt > 0 ? asInt : defaultValue;
        }
        try {
            int parsed = Integer.parseInt(value.toString());
            return parsed > 0 ? parsed : defaultValue;
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }

    private UUID parseTenantId(AgentExecutionContext context) {
        if (context == null || context.getTenantId() == null || context.getTenantId().isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(context.getTenantId());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}

