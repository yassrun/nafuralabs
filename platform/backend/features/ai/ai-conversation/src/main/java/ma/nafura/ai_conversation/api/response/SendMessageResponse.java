package ma.nafura.platform.ai.conversation.api.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SendMessageResponse {
    private ConversationSessionResponse conversation;
    private ConversationMessageResponse userMessage;
    private ConversationMessageResponse assistantMessage;
}

