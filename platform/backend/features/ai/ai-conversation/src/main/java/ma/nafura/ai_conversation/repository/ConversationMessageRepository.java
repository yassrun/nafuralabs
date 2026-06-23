package ma.nafura.platform.ai.conversation.repository;

import ma.nafura.platform.ai.conversation.domain.model.ConversationMessage;
import ma.nafura.platform.ai.conversation.domain.model.ConversationSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ConversationMessageRepository extends JpaRepository<ConversationMessage, UUID> {
    List<ConversationMessage> findByConversationOrderByCreatedAtAsc(ConversationSession conversation);
}

