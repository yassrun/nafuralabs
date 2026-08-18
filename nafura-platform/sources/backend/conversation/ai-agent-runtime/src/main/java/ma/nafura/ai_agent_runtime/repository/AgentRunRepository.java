package ma.nafura.platform.ai.agent.repository;

import ma.nafura.platform.ai.agent.domain.model.AgentRun;
import ma.nafura.platform.ai.conversation.domain.model.ConversationSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AgentRunRepository extends JpaRepository<AgentRun, UUID> {
    Page<AgentRun> findByConversationOrderByCreatedAtDesc(ConversationSession conversation, Pageable pageable);

    Optional<AgentRun> findTopByConversationOrderByCreatedAtDesc(ConversationSession conversation);
}


