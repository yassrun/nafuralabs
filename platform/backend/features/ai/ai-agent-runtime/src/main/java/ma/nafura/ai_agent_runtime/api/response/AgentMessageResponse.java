package ma.nafura.platform.ai.agent.api.response;

import lombok.Builder;
import lombok.Getter;
import ma.nafura.platform.ai.conversation.domain.model.ConversationMessageRole;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class AgentMessageResponse {
    private UUID id;
    private ConversationMessageRole role;
    private String content;
    private String requestId;
    private Instant createdAt;
}


