package ma.nafura.platform.ai.agent.api.response;

import lombok.Builder;
import lombok.Getter;
import ma.nafura.platform.ai.agent.domain.model.AgentActionStatus;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class AgentActionResponse {
    private UUID id;
    private UUID runId;
    private String toolKey;
    private String title;
    private String actionKey;
    private String permissionKey;
    private String entitlementKey;
    private boolean requiresApproval;
    private AgentActionStatus status;
    private String argsJson;
    private String resultJson;
    private String error;
    private Instant createdAt;
    private Instant updatedAt;
}

