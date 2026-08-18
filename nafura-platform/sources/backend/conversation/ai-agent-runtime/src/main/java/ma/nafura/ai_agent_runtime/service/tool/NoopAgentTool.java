package ma.nafura.platform.ai.agent.service.tool;

import ma.nafura.platform.ai.agent.service.AgentExecutionContext;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class NoopAgentTool implements AgentTool {
    @Override
    public String key() {
        return "noop";
    }

    @Override
    public AgentToolResult execute(AgentToolRequest request, AgentExecutionContext context) {
        return AgentToolResult.builder()
            .success(true)
            .message("No-op tool executed")
            .payload(Map.of(
                "applicationId", context.getApplicationId(),
                "conversationId", request.getConversationId(),
                "actionId", request.getActionId(),
                "arguments", request.getArguments() != null ? request.getArguments() : Map.of()
            ))
            .build();
    }
}

