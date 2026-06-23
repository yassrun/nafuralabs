package ma.nafura.platform.collaboration.webhook.service;

import java.time.OffsetDateTime;
import java.util.List;
import ma.nafura.platform.collaboration.webhook.domain.model.WebhookDelivery;
import ma.nafura.platform.collaboration.webhook.repository.WebhookDeliveryRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class WebhookRetryService {

    private final WebhookDeliveryRepository webhookDeliveryRepository;
    private final WebhookDispatcher webhookDispatcher;

    public WebhookRetryService(
            WebhookDeliveryRepository webhookDeliveryRepository,
            WebhookDispatcher webhookDispatcher
    ) {
        this.webhookDeliveryRepository = webhookDeliveryRepository;
        this.webhookDispatcher = webhookDispatcher;
    }

    @Scheduled(fixedRate = 30000L)
    public void retryPendingDeliveries() {
        OffsetDateTime now = OffsetDateTime.now();
        List<WebhookDelivery> candidates = webhookDeliveryRepository.findRetryCandidates(
                WebhookDelivery.Status.PENDING,
                3,
                now
        );
        for (WebhookDelivery candidate : candidates) {
            if (isReadyForRetry(candidate, now)) {
                webhookDispatcher.retryDelivery(candidate);
            }
        }
    }

    private boolean isReadyForRetry(WebhookDelivery delivery, OffsetDateTime now) {
        OffsetDateTime lastAttempt = delivery.getLastAttemptAt();
        if (lastAttempt == null) {
            return true;
        }
        int attempts = delivery.getAttempts();
        long waitSeconds = switch (attempts) {
            case 0 -> 0;
            case 1 -> 60;
            default -> 300;
        };
        return !lastAttempt.plusSeconds(waitSeconds).isAfter(now);
    }
}

