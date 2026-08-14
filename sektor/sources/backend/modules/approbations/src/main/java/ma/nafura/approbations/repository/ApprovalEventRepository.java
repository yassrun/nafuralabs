package ma.nafura.approbations.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.approbations.domain.model.ApprovalEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ApprovalEventRepository extends JpaRepository<ApprovalEvent, UUID> {

    List<ApprovalEvent> findByTenantIdAndRequestIdOrderByCreatedAtAsc(UUID tenantId, String requestId);
}
