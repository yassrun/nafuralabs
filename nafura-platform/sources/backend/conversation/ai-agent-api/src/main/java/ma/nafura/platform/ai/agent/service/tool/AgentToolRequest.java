package ma.nafura.platform.ai.agent.service.tool;

import lombok.Builder;
import lombok.Getter;

import java.util.Map;

@Getter
@Builder
public class AgentToolRequest {
    private String conversationId;
    private String actionId;
    private String actorSub;
    private String tenantId;
    private Map<String, Object> arguments;
}
