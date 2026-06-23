package ma.nafura.platform.ai.agent.api.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
public class AgentProposeRequest {
    @NotBlank
    private String content;

    private String systemInstruction;
    private Map<String, Object> metadata;

    private String domainKey;
    private String featureKey;
    private String resourceKey;
    private String actionKey;
}

