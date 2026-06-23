package ma.nafura.platform.collaboration.webhook.repository;

import ma.nafura.platform.collaboration.webhook.domain.model.WebhookDelivery;
import ma.nafura.platform.collaboration.webhook.domain.model.WebhookDelivery.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WebhookDeliveryRepository extends JpaRepository<WebhookDelivery, UUID> {

    Page<WebhookDelivery> findByWebhookIdOrderByCreatedAtDesc(UUID webhookId, Pageable pageable);

    Optional<WebhookDelivery> findFirstByWebhookIdOrderByCreatedAtDesc(UUID webhookId);

    Optional<WebhookDelivery> findByIdAndWebhookId(UUID id, UUID webhookId);

    @Query("""
        select d from WebhookDelivery d
        where d.status = :status
          and d.attempts < :maxAttempts
          and (d.lastAttemptAt is null or d.lastAttemptAt <= :before)
        order by d.createdAt asc
        """)
    List<WebhookDelivery> findRetryCandidates(
            @Param("status") Status status,
            @Param("maxAttempts") int maxAttempts,
            @Param("before") OffsetDateTime before
    );

    List<WebhookDelivery> findByStatusAndAttemptsLessThanAndLastAttemptAtBefore(
            Status status,
            int maxAttempts,
            OffsetDateTime before
    );
}

