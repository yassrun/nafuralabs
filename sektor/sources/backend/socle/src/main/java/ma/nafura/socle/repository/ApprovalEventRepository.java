package ma.nafura.socle.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.socle.domain.ApprovalEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ApprovalEventRepository extends JpaRepository<ApprovalEvent, UUID> {

    List<ApprovalEvent> findByTenantIdAndRequestIdOrderByCreatedAtAsc(UUID tenantId, String requestId);
}
