package ma.nafura.platform.ai.conversation.api.response;

import lombok.Builder;
import lombok.Getter;
import ma.nafura.platform.ai.conversation.domain.model.ConversationStatus;
import ma.nafura.platform.ai.llm.model.LlmMode;
import ma.nafura.platform.ai.llm.model.ScopeType;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class ConversationSessionResponse {
    private UUID id;
    private String applicationId;
    private String title;
    private LlmMode mode;
    private ScopeType scopeType;
    private ConversationStatus status;
    private Instant createdAt;
    private Instant updatedAt;
}


