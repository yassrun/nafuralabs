package ma.nafura.platform.ai.agent.api.response;

import java.util.List;
import lombok.Builder;
import lombok.Getter;
import ma.nafura.platform.ai.agent.model.AssistantBlock;
import ma.nafura.platform.ai.agent.model.AssistantLink;
import ma.nafura.platform.ai.agent.model.IntentType;

@Getter
@Builder
public class AssistantTurnResponse {
    private IntentType intent;
    private String summary;
    private List<AssistantBlock> blocks;
    private List<AssistantLink> links;
    private List<AgentActionResponse> actions;
    private AgentRunResponse run;
    private AgentMessageResponse userMessage;
    private AgentMessageResponse assistantMessage;
}
