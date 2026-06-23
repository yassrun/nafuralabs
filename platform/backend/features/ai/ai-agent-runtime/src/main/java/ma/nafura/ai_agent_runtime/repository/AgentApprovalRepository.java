package ma.nafura.platform.ai.agent.repository;

import ma.nafura.platform.ai.agent.domain.model.AgentApproval;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AgentApprovalRepository extends JpaRepository<AgentApproval, UUID> {
    List<AgentApproval> findByActionIdOrderByDecidedAtDesc(UUID actionId);
}

