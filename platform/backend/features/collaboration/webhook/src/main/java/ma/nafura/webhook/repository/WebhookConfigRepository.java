package ma.nafura.platform.collaboration.webhook.repository;

import ma.nafura.platform.collaboration.webhook.domain.model.WebhookConfig;
import ma.nafura.platform.collaboration.webhook.domain.model.WebhookEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WebhookConfigRepository extends JpaRepository<WebhookConfig, UUID> {

    long countByTenantId(UUID tenantId);

    Page<WebhookConfig> findByTenantIdOrderByCreatedAtDesc(UUID tenantId, Pageable pageable);

    Optional<WebhookConfig> findByIdAndTenantId(UUID id, UUID tenantId);

    @Query("""
        select w from WebhookConfig w
        where w.tenantId = :tenantId
          and w.active = true
          and (:event is null or :event member of w.events)
        """)
    List<WebhookConfig> findActiveByTenantAndEvent(@Param("tenantId") UUID tenantId, @Param("event") WebhookEvent event);
}

