package ma.nafura.platform.ai.agent.service.tool;

import lombok.Builder;
import lombok.Getter;

import java.util.Map;

@Getter
@Builder
public class AgentToolResult {
    private boolean success;
    private String message;
    private Map<String, Object> payload;
}
