package ma.nafura.platform.ai.agent.api.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AgentProposeResponse {
    private AgentRunResponse run;
    private List<AgentActionResponse> actions;
    private AgentMessageResponse userMessage;
    private AgentMessageResponse assistantMessage;
}

