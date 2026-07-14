package ma.nafura.platform.ai.agent.service.compose;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import ma.nafura.platform.ai.agent.model.AssistantBlock;
import ma.nafura.platform.ai.agent.model.AssistantBlockType;
import ma.nafura.platform.ai.agent.model.AssistantLink;
import ma.nafura.platform.ai.agent.service.tool.AgentToolResult;
import org.springframework.stereotype.Component;

@Component
public class AssistantBlockComposer {

    public List<AssistantBlock> fromToolResult(AgentToolResult result) {
        if (result == null || !result.isSuccess() || result.getPayload() == null) {
            return List.of();
        }
        Map<String, Object> payload = result.getPayload();
        List<AssistantBlock> blocks = new ArrayList<>();

        if (payload.containsKey("items") && payload.get("items") instanceof List<?> items && !items.isEmpty()) {
            blocks.add(AssistantBlock.builder()
                    .type(AssistantBlockType.LIST)
                    .title(asString(payload.get("entityType")))
                    .content(result.getMessage())
                    .data(Map.of("items", items, "total", payload.getOrDefault("total", items.size())))
                    .build());
        }

        if (payload.containsKey("results") && payload.get("results") instanceof List<?> results && !results.isEmpty()) {
            blocks.add(AssistantBlock.builder()
                    .type(AssistantBlockType.LIST)
                    .title("Search results")
                    .content(result.getMessage())
                    .data(Map.of("items", results))
                    .build());
        }

        if (payload.containsKey("count") || payload.containsKey("totalCount")) {
            Object value = payload.containsKey("count") ? payload.get("count") : payload.get("totalCount");
            blocks.add(AssistantBlock.builder()
                    .type(AssistantBlockType.KPI)
                    .title(asString(payload.getOrDefault("metric", "Total")))
                    .content(String.valueOf(value))
                    .data(payload)
                    .build());
        }

        if (payload.containsKey("valorisationStock") || payload.containsKey("kpis")) {
            blocks.add(AssistantBlock.builder()
                    .type(AssistantBlockType.KPI)
                    .title("Stock KPIs")
                    .content(result.getMessage())
                    .data(payload)
                    .build());
        }

        // execute_sql payload: never surface tool ack ("OK") — the LLM summary is the user-facing answer
        if (payload.containsKey("rows") || payload.containsKey("rowCount") || payload.containsKey("columns")) {
            return blocks;
        }

        if (blocks.isEmpty() && result.getMessage() != null && !isToolAckMessage(result.getMessage())) {
            blocks.add(AssistantBlock.builder()
                    .type(AssistantBlockType.TEXT)
                    .content(result.getMessage())
                    .data(payload)
                    .build());
        }

        return blocks;
    }

    /** Success acks from tools (e.g. SqlQueryTool message "OK") must not appear as assistant bubbles. */
    private boolean isToolAckMessage(String message) {
        String normalized = message.trim();
        return normalized.equalsIgnoreCase("OK")
                || normalized.equalsIgnoreCase("Success")
                || normalized.equalsIgnoreCase("Done");
    }

    public List<AssistantLink> linksFromPayload(Map<String, Object> payload) {
        if (payload == null || payload.isEmpty()) {
            return List.of();
        }
        List<AssistantLink> links = new ArrayList<>();
        String route = asString(payload.get("route"));
        if (route != null) {
            links.add(AssistantLink.builder()
                    .label(asString(payload.getOrDefault("label", "Open")))
                    .route(route)
                    .autoNavigate(false)
                    .build());
        }
        if (payload.get("links") instanceof List<?> rawLinks) {
            for (Object raw : rawLinks) {
                if (raw instanceof Map<?, ?> map) {
                    String linkRoute = asString(map.get("route"));
                    if (linkRoute != null) {
                        links.add(AssistantLink.builder()
                                .label(asString(map.get("label") != null ? map.get("label") : "Open"))
                                .route(linkRoute)
                                .icon(asString(map.get("icon")))
                                .autoNavigate(Boolean.TRUE.equals(map.get("autoNavigate")))
                                .build());
                    }
                }
            }
        }
        return links;
    }

    public AssistantBlock textBlock(String content) {
        return AssistantBlock.builder()
                .type(AssistantBlockType.TEXT)
                .content(content)
                .build();
    }

    private String asString(Object value) {
        if (value == null) {
            return null;
        }
        String s = value.toString().trim();
        return s.isEmpty() ? null : s;
    }
}
