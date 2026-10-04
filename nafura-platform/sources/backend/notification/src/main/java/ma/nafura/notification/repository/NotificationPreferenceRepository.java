package ma.nafura.platform.collaboration.notification.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import ma.nafura.platform.collaboration.notification.domain.model.NotificationPreference;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationPreferenceRepository extends TenantScopedRepository<NotificationPreference, UUID> {

    /** The organisation's choices. */
    List<NotificationPreference> findByTenantIdAndUserIdIsNull(UUID tenantId);

    List<NotificationPreference> findByTenantIdAndUserId(UUID tenantId, UUID userId);

    Optional<NotificationPreference> findByTenantIdAndUserIdIsNullAndEventAndChannel(UUID tenantId, String event, String channel);

    Optional<NotificationPreference> findByTenantIdAndUserIdAndEventAndChannel(UUID tenantId, UUID userId, String event, String channel);
}
