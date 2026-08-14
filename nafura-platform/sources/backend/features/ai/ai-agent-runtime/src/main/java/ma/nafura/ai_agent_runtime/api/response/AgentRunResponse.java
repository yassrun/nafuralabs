package ma.nafura.platform.ai.agent.api.response;

import lombok.Builder;
import lombok.Getter;
import ma.nafura.platform.ai.agent.domain.model.AgentRunStatus;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class AgentRunResponse {
    private UUID id;
    private AgentRunStatus status;
    private String model;
    private String llmRequestId;
    private Double llmCostUsd;
    private String error;
    private Instant createdAt;
    private Instant updatedAt;
}

