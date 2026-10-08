package ma.nafura.platform.collaboration.webhook.controller;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.collaboration.webhook.domain.model.WebhookConfig;
import ma.nafura.platform.collaboration.webhook.domain.model.WebhookDelivery;
import ma.nafura.platform.collaboration.webhook.repository.WebhookConfigRepository;
import ma.nafura.platform.collaboration.webhook.repository.WebhookDeliveryRepository;
import ma.nafura.platform.collaboration.webhook.service.WebhookDispatcher;
import ma.nafura.platform.collaboration.webhook.service.WebhookService;
import ma.nafura.platform.framework.record.RecordController;
import ma.nafura.platform.framework.record.RecordRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Outgoing webhooks of the organization, a record, plus their deliveries and a test call.
 * Permissions: administration.integrations.webhooks.{read,create,update,delete}.
 */
@RestController
@RequestMapping("/api/v1/platform/admin/webhooks")
@SecuredResource(domain = "administration", feature = "integrations", resource = "webhooks")
public class WebhookController extends RecordController<WebhookConfig> {

    private final WebhookConfigRepository repository;
    private final WebhookDeliveryRepository deliveries;
    private final WebhookDispatcher dispatcher;
    private final WebhookService rules;

    public WebhookController(WebhookConfigRepository repository, WebhookDeliveryRepository deliveries,
                             WebhookDispatcher dispatcher, WebhookService rules) {
        this.repository = repository;
        this.deliveries = deliveries;
        this.dispatcher = dispatcher;
        this.rules = rules;
    }

    @Override protected RecordRepository<WebhookConfig> repository() { return repository; }
    @Override protected String recordResource() { return "records/webhook.json"; }
    @Override protected String labelField() { return "name"; }

    @Override
    protected Map<String, String> validate(WebhookConfig webhook, WebhookConfig previous) {
        if (previous == null && blank(webhook.getSecret())) {
            return Map.of("secret", "Obligatoire à la création");
        }
        return Map.of();
    }

    @Override
    protected void beforeSave(WebhookConfig webhook, WebhookConfig previous) {
        if (previous == null) {
            rules.requireRoomFor(webhook.getTenantId());
        }
        webhook.setName(webhook.getName().trim());
        webhook.setUrl(webhook.getUrl().trim());
        webhook.setSecret(blank(webhook.getSecret()) ? previous.getSecret() : webhook.getSecret().trim());
    }

    @Override
    protected void beforeDelete(WebhookConfig webhook) {
        rules.deleteDeliveries(webhook.getId());
    }

    @GetMapping("/{id}/deliveries")
    @RequirePermission("read")
    public Page<WebhookDeliveryDto> listDeliveries(@PathVariable UUID id, Pageable pageable) {
        require(id);
        return deliveries.findByWebhookIdOrderByCreatedAtDesc(id, pageable).map(WebhookController::toDeliveryDto);
    }

    @PostMapping("/{id}/test")
    @RequirePermission("update")
    public TestWebhookResponse test(@PathVariable UUID id) {
        WebhookDelivery delivery = dispatcher.triggerTest(require(id));
        boolean success = delivery != null && delivery.getStatus() == WebhookDelivery.Status.SUCCESS;
        return new TestWebhookResponse(success, delivery != null ? delivery.getResponseCode() : null);
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private static WebhookDeliveryDto toDeliveryDto(WebhookDelivery delivery) {
        return new WebhookDeliveryDto(
                delivery.getId(),
                delivery.getWebhookId(),
                delivery.getEvent(),
                delivery.getStatus().name(),
                delivery.getAttempts(),
                delivery.getResponseCode(),
                delivery.getErrorMessage(),
                delivery.getPayload(),
                delivery.getResponseBody(),
                delivery.getCreatedAt(),
                delivery.getLastAttemptAt()
        );
    }

    public record WebhookDeliveryDto(
            UUID id,
            UUID webhookId,
            String event,
            String status,
            int attempts,
            Integer responseCode,
            String errorMessage,
            String payload,
            String responseBody,
            OffsetDateTime createdAt,
            OffsetDateTime lastAttemptAt
    ) {}

    public record TestWebhookResponse(boolean success, Integer responseCode) {}
}
