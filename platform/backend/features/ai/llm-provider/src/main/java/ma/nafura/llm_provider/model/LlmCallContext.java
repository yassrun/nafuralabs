package ma.nafura.platform.ai.llm.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LlmCallContext {
    private String applicationId;
    private String domainKey;
    private String featureKey;
    private String resourceKey;
    private String actionKey;

    @Builder.Default
    private LlmMode mode = LlmMode.ASK;

    private String conversationId;
    private String messageId;
    private String actorSub;
    private String tenantId;

    @Builder.Default
    private ScopeType scopeType = ScopeType.TENANT;

    private String idempotencyKey;
}

