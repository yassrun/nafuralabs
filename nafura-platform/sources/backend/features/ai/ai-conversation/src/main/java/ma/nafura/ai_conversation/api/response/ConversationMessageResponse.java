package ma.nafura.platform.ai.conversation.api.response;

import lombok.Builder;
import lombok.Getter;
import ma.nafura.platform.ai.conversation.domain.model.ConversationMessageRole;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class ConversationMessageResponse {
    private UUID id;
    private ConversationMessageRole role;
    private String content;
    private String requestId;
    private Double costUsd;
    private Long tokensIn;
    private Long tokensOut;
    private Long tokensTotal;
    private Instant createdAt;
}

