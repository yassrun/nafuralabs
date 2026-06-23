package ma.nafura.platform.ai.agent.service.tool;

import ma.nafura.platform.ai.agent.service.AgentExecutionContext;

public interface AgentTool {
    String key();

    AgentToolResult execute(AgentToolRequest request, AgentExecutionContext context);
}
