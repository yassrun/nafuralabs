package ma.nafura.platform.ai.agent.service;

import lombok.Builder;
import lombok.Getter;
import ma.nafura.platform.ai.llm.model.ScopeType;

@Getter
@Builder
public class AgentExecutionContext {
    private String applicationId;
    private String actorSub;
    private String tenantId;
    private ScopeType scopeType;
}
