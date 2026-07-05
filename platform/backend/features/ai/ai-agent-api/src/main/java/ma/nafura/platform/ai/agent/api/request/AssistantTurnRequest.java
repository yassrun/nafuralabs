package ma.nafura.platform.ai.agent.api.request;

import java.util.Map;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AssistantTurnRequest {
    private String content;

    private String systemInstruction;
    private Map<String, Object> metadata;

    private String domainKey;
    private String featureKey;
    private String resourceKey;
    private String actionKey;

    /** Current Angular route (context bus). */
    private String currentRoute;
    /** Entity type in focus, if any. */
    private String entityType;
    /** Entity id in focus, if any. */
    private String entityId;
}
