package ma.nafura.approbations.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.approbations.domain.model.ApprovalRequest;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

/** Named Erp* to avoid bean clash with platform {@code ma.nafura.workflow.repository.ApprovalRequestRepository}. */
@Repository
public interface ErpApprovalRequestRepository extends TenantScopedRepository<ApprovalRequest, String> {

    List<ApprovalRequest> findByTenantIdOrderByDateSoumissionDescCreatedAtDesc(UUID tenantId);

    List<ApprovalRequest> findByTenantIdAndStatusInOrderByDateSoumissionDescCreatedAtDesc(
            UUID tenantId, List<String> statuses);

    Optional<ApprovalRequest> findByTenantIdAndEntityTypeAndEntityIdAndStatusIn(
            UUID tenantId, String entityType, String entityId, List<String> statuses);

    long countByTenantId(UUID tenantId);

    long countByTenantIdAndStatusIn(UUID tenantId, List<String> statuses);
}
