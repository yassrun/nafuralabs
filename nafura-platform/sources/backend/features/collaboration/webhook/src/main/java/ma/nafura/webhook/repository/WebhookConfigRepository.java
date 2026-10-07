package ma.nafura.platform.collaboration.webhook.repository;

import ma.nafura.platform.collaboration.webhook.domain.model.WebhookConfig;
import ma.nafura.platform.collaboration.webhook.domain.model.WebhookEvent;
import ma.nafura.platform.framework.record.RecordRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WebhookConfigRepository extends RecordRepository<WebhookConfig> {

    long countByTenantId(UUID tenantId);

    Optional<WebhookConfig> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query("""
        select w from WebhookConfig w
        where w.tenantId = :tenantId
          and w.active = true
          and (:event is null or :event member of w.events)
        """)
    List<WebhookConfig> findActiveByTenantAndEvent(@Param("tenantId") UUID tenantId, @Param("event") WebhookEvent event);
}

