package ma.nafura.platform.collaboration.webhook.service;

import java.util.UUID;
import ma.nafura.platform.collaboration.webhook.domain.model.WebhookConfig;
import ma.nafura.platform.collaboration.webhook.repository.WebhookConfigRepository;
import ma.nafura.platform.collaboration.webhook.repository.WebhookDeliveryRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.record.RecordRuleException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Rules of a webhook around its record API: a quota per organization, deliveries removed with it. */
@Service
public class WebhookService {

    private static final int MAX_WEBHOOKS_PER_TENANT = 10;

    private final WebhookConfigRepository webhookConfigRepository;
    private final WebhookDeliveryRepository webhookDeliveryRepository;

    public WebhookService(WebhookConfigRepository webhookConfigRepository, WebhookDeliveryRepository webhookDeliveryRepository) {
        this.webhookConfigRepository = webhookConfigRepository;
        this.webhookDeliveryRepository = webhookDeliveryRepository;
    }

    @Transactional(readOnly = true)
    public WebhookConfig getById(UUID id) {
        return webhookConfigRepository.findByIdAndTenantId(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Webhook not found"));
    }

    public void requireRoomFor(UUID tenantId) {
        if (webhookConfigRepository.countByTenantId(tenantId) >= MAX_WEBHOOKS_PER_TENANT) {
            throw RecordRuleException.refused("Nombre maximal de webhooks atteint pour l’organisation (" + MAX_WEBHOOKS_PER_TENANT + ")");
        }
    }

    public void deleteDeliveries(UUID webhookId) {
        webhookDeliveryRepository.deleteByWebhookId(webhookId);
    }
}
