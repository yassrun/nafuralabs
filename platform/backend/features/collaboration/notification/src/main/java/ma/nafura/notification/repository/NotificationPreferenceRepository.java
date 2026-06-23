package ma.nafura.platform.collaboration.notification.repository;

import java.util.Optional;
import java.util.UUID;

import ma.nafura.platform.collaboration.notification.domain.model.NotificationPreference;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationPreferenceRepository extends TenantScopedRepository<NotificationPreference, UUID> {

    Optional<NotificationPreference> findFirstByTenantIdAndUserIdAndEventType(
            UUID tenantId,
            UUID userId,
            String eventType
    );
}


