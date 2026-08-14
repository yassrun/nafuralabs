package ma.nafura.platform.ai.agent.service.tool;

import java.util.Map;
import ma.nafura.platform.ai.agent.service.AgentExecutionContext;

/**
 * Product-specific extensions for the {@code action} agent tool.
 */
public interface AgentEntityActionHandler {

    boolean supports(String entityType, String operation);

    AgentToolResult execute(
        AgentToolRequest request,
        AgentExecutionContext context,
        String operation,
        String entityType,
        Map<String, Object> data,
        String entityIdRaw
    );
}
