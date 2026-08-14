package ma.nafura.platform.ai.conversation.api.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
public class SendMessageRequest {
    @NotBlank
    private String content;

    private String systemInstruction;
    private String responseSchema;
    private Map<String, Object> metadata;

    private String domainKey;
    private String featureKey;
    private String resourceKey;
    private String actionKey;
}

