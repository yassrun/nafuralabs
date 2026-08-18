package ma.nafura.platform.ai.agent.repository;

import ma.nafura.platform.ai.agent.domain.model.AgentAction;
import ma.nafura.platform.ai.agent.domain.model.AgentActionStatus;
import ma.nafura.platform.ai.conversation.domain.model.ConversationSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AgentActionRepository extends JpaRepository<AgentAction, UUID> {
    List<AgentAction> findByConversationOrderByCreatedAtDesc(ConversationSession conversation);

    long countByRun_IdAndStatus(UUID runId, AgentActionStatus status);

    Optional<AgentAction> findByIdAndConversation_Id(UUID id, UUID conversationId);
}


