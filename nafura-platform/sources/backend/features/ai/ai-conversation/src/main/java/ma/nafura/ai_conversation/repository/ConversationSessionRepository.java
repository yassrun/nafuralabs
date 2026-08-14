package ma.nafura.platform.ai.conversation.repository;

import ma.nafura.platform.ai.conversation.domain.model.ConversationSession;
import ma.nafura.platform.ai.llm.model.ScopeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ConversationSessionRepository extends JpaRepository<ConversationSession, UUID> {
    Page<ConversationSession> findByApplicationIdAndActorSubAndScopeTypeAndTenantIdOrderByUpdatedAtDesc(
        String applicationId,
        String actorSub,
        ScopeType scopeType,
        String tenantId,
        Pageable pageable
    );

    Page<ConversationSession> findByApplicationIdAndActorSubAndScopeTypeOrderByUpdatedAtDesc(
        String applicationId,
        String actorSub,
        ScopeType scopeType,
        Pageable pageable
    );

    Optional<ConversationSession> findByIdAndApplicationIdAndActorSub(UUID id, String applicationId, String actorSub);
}


