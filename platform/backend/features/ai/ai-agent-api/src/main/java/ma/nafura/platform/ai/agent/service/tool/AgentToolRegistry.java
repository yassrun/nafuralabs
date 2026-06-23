package ma.nafura.platform.ai.agent.service.tool;

import java.util.Optional;

/**
 * Registry of agent tools. Implementation lives in ai-agent-runtime.
 */
public interface AgentToolRegistry {
    Optional<AgentTool> find(String key);
}
