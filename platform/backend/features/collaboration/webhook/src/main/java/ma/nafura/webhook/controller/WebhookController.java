package ma.nafura.platform.collaboration.webhook.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.collaboration.webhook.domain.model.WebhookConfig;
import ma.nafura.platform.collaboration.webhook.domain.model.WebhookDelivery;
import ma.nafura.platform.collaboration.webhook.domain.model.WebhookEvent;
import ma.nafura.platform.collaboration.webhook.repository.WebhookDeliveryRepository;
import ma.nafura.platform.collaboration.webhook.service.WebhookDispatcher;
import ma.nafura.platform.collaboration.webhook.service.WebhookService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/platform/admin/webhooks")
@SecuredResource(domain = "administration", feature = "administration", resource = "webhooks")
public class WebhookController {

    private final WebhookService webhookService;
    private final WebhookDeliveryRepository webhookDeliveryRepository;
    private final WebhookDispatcher webhookDispatcher;

    public WebhookController(
            WebhookService webhookService,
            WebhookDeliveryRepository webhookDeliveryRepository,
            WebhookDispatcher webhookDispatcher
    ) {
        this.webhookService = webhookService;
        this.webhookDeliveryRepository = webhookDeliveryRepository;
        this.webhookDispatcher = webhookDispatcher;
    }

    @GetMapping
    @RequirePermission(value = "administration.webhooks.read", fullPermission = true)
    public Page<WebhookConfigDto> list(Pageable pageable) {
        return webhookService.listForTenant(pageable).map(this::toDto);
    }

    @PostMapping
    @RequirePermission(value = "administration.webhooks.write", fullPermission = true)
    public ResponseEntity<WebhookConfigDto> create(@Valid @RequestBody CreateWebhookRequest request) {
        WebhookConfig created = webhookService.create(
                new WebhookService.WebhookUpsertRequest(
                        request.name(),
                        request.url(),
                        request.secret(),
                        request.events(),
                        request.active()
                )
        );
        return ResponseEntity.ok(toDto(created));
    }

    @PutMapping("/{id}")
    @RequirePermission(value = "administration.webhooks.write", fullPermission = true)
    public ResponseEntity<WebhookConfigDto> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateWebhookRequest request
    ) {
        WebhookConfig updated = webhookService.update(
                id,
                new WebhookService.WebhookUpsertRequest(
                        request.name(),
                        request.url(),
                        request.secret(),
                        request.events(),
                        request.active()
                )
        );
        return ResponseEntity.ok(toDto(updated));
    }

    @DeleteMapping("/{id}")
    @RequirePermission(value = "administration.webhooks.write", fullPermission = true)
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        webhookService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/deliveries")
    @RequirePermission(value = "administration.webhooks.read", fullPermission = true)
    public Page<WebhookDeliveryDto> listDeliveries(@PathVariable UUID id, Pageable pageable) {
        webhookService.getById(id); // tenant guard
        return webhookDeliveryRepository.findByWebhookIdOrderByCreatedAtDesc(id, pageable)
                .map(this::toDeliveryDto);
    }

    @PostMapping("/{id}/test")
    @RequirePermission(value = "administration.webhooks.write", fullPermission = true)
    public ResponseEntity<TestWebhookResponse> test(@PathVariable UUID id) {
        WebhookConfig config = webhookService.getById(id);
        WebhookDelivery delivery = webhookDispatcher.triggerTest(config);
        boolean success = delivery != null && delivery.getStatus() == WebhookDelivery.Status.SUCCESS;
        return ResponseEntity.ok(new TestWebhookResponse(success, delivery != null ? delivery.getResponseCode() : null));
    }

    private WebhookConfigDto toDto(WebhookConfig config) {
        WebhookDelivery latest = webhookDeliveryRepository
                .findFirstByWebhookIdOrderByCreatedAtDesc(config.getId())
                .orElse(null);

        return new WebhookConfigDto(
                config.getId(),
                config.getName(),
                config.getUrl(),
                config.getEvents(),
                config.isActive(),
                config.getCreatedAt(),
                config.getUpdatedAt(),
                latest != null ? latest.getStatus().name() : null
        );
    }

    private WebhookDeliveryDto toDeliveryDto(WebhookDelivery delivery) {
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

    public record CreateWebhookRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Size(max = 500) String url,
            @NotBlank @Size(max = 200) String secret,
            @NotEmpty List<WebhookEvent> events,
            Boolean active
    ) {}

    public record UpdateWebhookRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Size(max = 500) String url,
            @NotBlank @Size(max = 200) String secret,
            @NotEmpty List<WebhookEvent> events,
            Boolean active
    ) {}

    public record WebhookConfigDto(
            UUID id,
            String name,
            String url,
            List<WebhookEvent> events,
            boolean active,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt,
            String lastDeliveryStatus
    ) {}

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

