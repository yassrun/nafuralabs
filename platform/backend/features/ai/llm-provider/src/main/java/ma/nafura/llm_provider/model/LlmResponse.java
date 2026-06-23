package ma.nafura.platform.ai.llm.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LlmResponse {
    private String requestId;
    private String tenantId; // clientId/tenantId
    private String provider;
    private String model;
    private String content; // response content (JSON or text)
    private TokenUsage usage;
    private Double costUsd;
    private Instant createdAt;
    private LlmMode mode;
    private ScopeType scopeType;
    private String applicationId;
    private String domainKey;
    private String featureKey;
    private String resourceKey;
    private String actionKey;
    private String conversationId;
    private String messageId;
    private String actorSub;

    /** Tool calls requested by the LLM (non-null when LLM wants to use tools). */
    private List<ToolCall> toolCalls;
    /** Finish reason: STOP, TOOL_CALL, MAX_TOKENS, ERROR. */
    private FinishReason finishReason;

    public boolean requiresToolExecution() {
        return toolCalls != null && !toolCalls.isEmpty();
    }

    public enum FinishReason {
        STOP,       // Normal completion — content has the final answer
        TOOL_CALL,  // LLM wants to call tools — check toolCalls list
        MAX_TOKENS, // Hit token limit
        ERROR       // Provider error
    }
}

