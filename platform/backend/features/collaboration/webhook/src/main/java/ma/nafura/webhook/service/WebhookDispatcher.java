package ma.nafura.platform.collaboration.webhook.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.platform.collaboration.notification.event.NotificationEvent;
import ma.nafura.platform.collaboration.webhook.domain.model.WebhookConfig;
import ma.nafura.platform.collaboration.webhook.domain.model.WebhookDelivery;
import ma.nafura.platform.collaboration.webhook.domain.model.WebhookEvent;
import ma.nafura.platform.collaboration.webhook.repository.WebhookConfigRepository;
import ma.nafura.platform.collaboration.webhook.repository.WebhookDeliveryRepository;
import ma.nafura.platform.collaboration.workflow.event.ApprovalStateChangedEvent;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Component
public class WebhookDispatcher {

    private final WebhookConfigRepository webhookConfigRepository;
    private final WebhookDeliveryRepository webhookDeliveryRepository;
    private final WebhookPayloadBuilder payloadBuilder;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final ThreadPoolTaskExecutor webhookTaskExecutor;

    public WebhookDispatcher(
            WebhookConfigRepository webhookConfigRepository,
            WebhookDeliveryRepository webhookDeliveryRepository,
            WebhookPayloadBuilder payloadBuilder,
            ObjectMapper objectMapper,
            @Qualifier("webhookRestTemplate") RestTemplate restTemplate,
            ThreadPoolTaskExecutor webhookTaskExecutor
    ) {
        this.webhookConfigRepository = webhookConfigRepository;
        this.webhookDeliveryRepository = webhookDeliveryRepository;
        this.payloadBuilder = payloadBuilder;
        this.objectMapper = objectMapper;
        this.restTemplate = restTemplate;
        this.webhookTaskExecutor = webhookTaskExecutor;
    }

    @EventListener
    public void onApprovalEvent(ApprovalStateChangedEvent event) {
        WebhookEvent mapped = mapApprovalEvent(event.getNewStatus());
        if (mapped == null) {
            return;
        }
        dispatch(
                event.getTenantId(),
                mapped,
                Map.of(
                        "approvalRequestId", event.getApprovalRequestId(),
                        "entityType", event.getEntityType(),
                        "entityId", event.getEntityId(),
                        "status", event.getNewStatus(),
                        "decidedBy", event.getDecidedBy()
                )
        );
    }

    @EventListener
    public void onNotificationEvent(NotificationEvent event) {
        String source = event.getSource() != null ? event.getSource().toLowerCase() : "";
        WebhookEvent mapped = switch (source) {
            case "member_invited" -> WebhookEvent.MEMBER_INVITED;
            case "member_activated" -> WebhookEvent.MEMBER_ACTIVATED;
            case "domain_activated" -> WebhookEvent.DOMAIN_ACTIVATED;
            default -> null;
        };
        if (mapped == null) {
            return;
        }
        UUID tenantId = TenantContext.getTenantIdOrNull();
        if (tenantId == null) {
            return;
        }
        dispatch(
                tenantId,
                mapped,
                Map.of(
                        "recipientId", event.getRecipientId(),
                        "entityType", event.getEntityType(),
                        "entityId", event.getEntityId(),
                        "source", event.getSource()
                )
        );
    }

    public void dispatch(UUID tenantId, WebhookEvent event, Map<String, Object> eventData) {
        if (tenantId == null || event == null) {
            return;
        }
        List<WebhookConfig> targets = webhookConfigRepository.findActiveByTenantAndEvent(tenantId, event);
        for (WebhookConfig target : targets) {
            WebhookDelivery delivery = createPendingDelivery(target, event, tenantId, eventData);
            webhookTaskExecutor.execute(() -> deliverNow(delivery.getId()));
        }
    }

    public WebhookDelivery triggerTest(WebhookConfig config) {
        WebhookDelivery delivery = createPendingDelivery(
                config,
                WebhookEvent.ENTITY_UPDATED,
                config.getTenantId(),
                Map.of("test", true, "name", config.getName())
        );
        return deliverNow(delivery.getId());
    }

    public WebhookDelivery retryDelivery(WebhookDelivery delivery) {
        return deliverNow(delivery.getId());
    }

    public WebhookDelivery deliverNow(UUID deliveryId) {
        WebhookDelivery delivery = webhookDeliveryRepository.findById(deliveryId).orElse(null);
        if (delivery == null) {
            return null;
        }
        WebhookConfig config = webhookConfigRepository.findById(delivery.getWebhookId()).orElse(null);
        if (config == null || !config.isActive()) {
            delivery.setStatus(WebhookDelivery.Status.FAILED);
            delivery.setErrorMessage("Webhook config unavailable");
            delivery.setLastAttemptAt(OffsetDateTime.now());
            delivery.setAttempts(delivery.getAttempts() + 1);
            return webhookDeliveryRepository.save(delivery);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Nafura-Signature-256", sign(config.getSecret(), delivery.getPayload()));
        HttpEntity<String> request = new HttpEntity<>(delivery.getPayload(), headers);

        OffsetDateTime now = OffsetDateTime.now();
        delivery.setAttempts(delivery.getAttempts() + 1);
        delivery.setLastAttemptAt(now);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(config.getUrl(), request, String.class);
            delivery.setResponseCode(response.getStatusCode().value());
            delivery.setResponseBody(response.getBody());
            if (response.getStatusCode().is2xxSuccessful()) {
                delivery.setStatus(WebhookDelivery.Status.SUCCESS);
                delivery.setErrorMessage(null);
            } else {
                delivery.setStatus(WebhookDelivery.Status.PENDING);
                delivery.setErrorMessage("Received non-2xx response");
            }
        } catch (RestClientException ex) {
            delivery.setStatus(WebhookDelivery.Status.PENDING);
            delivery.setErrorMessage(ex.getMessage());
            log.debug("Webhook delivery failed: {}", ex.getMessage());
        }

        if (delivery.getAttempts() >= 3 && delivery.getStatus() != WebhookDelivery.Status.SUCCESS) {
            delivery.setStatus(WebhookDelivery.Status.FAILED);
        }

        return webhookDeliveryRepository.save(delivery);
    }

    private WebhookDelivery createPendingDelivery(
            WebhookConfig config,
            WebhookEvent event,
            UUID tenantId,
            Map<String, Object> eventData
    ) {
        WebhookDelivery delivery = new WebhookDelivery();
        delivery.setWebhookId(config.getId());
        delivery.setTenantId(tenantId);
        delivery.setEvent(event.name());
        delivery.setStatus(WebhookDelivery.Status.PENDING);
        delivery.setAttempts(0);
        delivery.setCreatedAt(OffsetDateTime.now());
        delivery = webhookDeliveryRepository.save(delivery);

        try {
            Map<String, Object> payload = payloadBuilder.buildPayload(delivery.getId(), event, tenantId, eventData);
            delivery.setPayload(objectMapper.writeValueAsString(payload));
        } catch (JsonProcessingException e) {
            delivery.setPayload("{\"error\":\"payload_serialization_failed\"}");
        }
        return webhookDeliveryRepository.save(delivery);
    }

    private WebhookEvent mapApprovalEvent(String status) {
        if (status == null) {
            return null;
        }
        return switch (status.toUpperCase()) {
            case "PENDING" -> WebhookEvent.APPROVAL_REQUESTED;
            case "APPROVED" -> WebhookEvent.APPROVAL_APPROVED;
            case "REJECTED" -> WebhookEvent.APPROVAL_REJECTED;
            default -> null;
        };
    }

    private String sign(String secret, String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(key);
            byte[] digest = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            return "";
        }
    }
}

