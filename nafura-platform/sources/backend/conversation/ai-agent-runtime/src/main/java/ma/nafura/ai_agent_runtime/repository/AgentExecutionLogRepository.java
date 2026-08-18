package ma.nafura.platform.ai.agent.repository;

import ma.nafura.platform.ai.agent.domain.model.AgentExecutionLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AgentExecutionLogRepository extends JpaRepository<AgentExecutionLog, UUID> {
    List<AgentExecutionLog> findByActionIdOrderByCreatedAtAsc(UUID actionId);
}

