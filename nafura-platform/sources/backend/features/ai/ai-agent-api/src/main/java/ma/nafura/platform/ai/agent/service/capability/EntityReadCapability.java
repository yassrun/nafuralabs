package ma.nafura.platform.ai.agent.service.capability;

import java.util.Map;
import lombok.Builder;
import lombok.Getter;
import ma.nafura.platform.ai.agent.service.AgentExecutionContext;

/**
 * Product extension: read entity data through the same services as REST/GUI screens.
 */
public interface EntityReadCapability {

    boolean supports(String entityType, String operation);

    EntityReadResult read(EntityReadRequest request, AgentExecutionContext context);

    @Getter
    @Builder
    class EntityReadRequest {
        private final String entityType;
        private final String operation;
        private final Map<String, Object> filters;
        private final int limit;
    }

    @Getter
    @Builder
    class EntityReadResult {
        private final boolean success;
        private final String message;
        private final Map<String, Object> payload;
    }
}
