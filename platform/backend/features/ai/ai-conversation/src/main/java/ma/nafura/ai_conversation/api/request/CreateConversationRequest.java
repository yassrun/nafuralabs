package ma.nafura.platform.ai.conversation.api.request;

import lombok.Getter;
import lombok.Setter;
import ma.nafura.platform.ai.llm.model.LlmMode;

@Getter
@Setter
public class CreateConversationRequest {
    private String applicationId;
    private String title;
    private LlmMode mode = LlmMode.ASK;
}


