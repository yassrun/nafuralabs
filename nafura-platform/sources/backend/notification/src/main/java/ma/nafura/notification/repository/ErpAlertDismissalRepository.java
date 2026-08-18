package ma.nafura.platform.collaboration.notification.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.platform.collaboration.notification.domain.model.ErpAlertDismissal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ErpAlertDismissalRepository
        extends JpaRepository<ErpAlertDismissal, ErpAlertDismissal.ErpAlertDismissalId> {

    List<ErpAlertDismissal> findByTenantIdAndUserId(UUID tenantId, UUID userId);

    void deleteByTenantIdAndUserIdAndAlertKeyIn(UUID tenantId, UUID userId, List<String> alertKeys);
}
