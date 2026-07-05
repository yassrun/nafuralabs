package ma.nafura.platform.ai.agent.service.tool;

import java.util.Map;
import java.util.Objects;
import ma.nafura.platform.ai.agent.service.AgentExecutionContext;
import ma.nafura.platform.ai.agent.service.navigation.NavigationResolver;
import ma.nafura.platform.ai.agent.service.navigation.NavigationTarget;
import org.springframework.stereotype.Component;

@Component
public class NavigateAgentTool implements AgentTool {

    private final NavigationResolver navigationResolver;

    public NavigateAgentTool(NavigationResolver navigationResolver) {
        this.navigationResolver = navigationResolver;
    }

    @Override
    public String key() {
        return "navigate";
    }

    @Override
    public AgentToolResult execute(AgentToolRequest request, AgentExecutionContext context) {
        Map<String, Object> args = request.getArguments() != null ? request.getArguments() : Map.of();

        String target = trimToNull((String) args.get("target"));
        String entityType = trimToNull((String) args.get("entityType"));
        String entityId = trimToNull((String) args.get("entityId"));

        return navigationResolver.resolve(target, entityType, entityId)
                .map(this::toResult)
                .orElseGet(() -> AgentToolResult.builder()
                        .success(false)
                        .message("Navigation target not found")
                        .payload(Map.of("route", "", "label", "", "navigated", false))
                        .build());
    }

    private AgentToolResult toResult(NavigationTarget navigationTarget) {
        return AgentToolResult.builder()
                .success(true)
                .message("Navigation target resolved")
                .payload(Map.of(
                        "route", Objects.requireNonNullElse(navigationTarget.getRoute(), ""),
                        "label", Objects.requireNonNullElse(navigationTarget.getLabel(), ""),
                        "navigated", true
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
}
