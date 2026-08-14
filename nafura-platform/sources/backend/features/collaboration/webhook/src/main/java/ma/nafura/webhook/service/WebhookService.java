package ma.nafura.platform.collaboration.webhook.service;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import ma.nafura.platform.collaboration.webhook.domain.model.WebhookConfig;
import ma.nafura.platform.collaboration.webhook.domain.model.WebhookEvent;
import ma.nafura.platform.collaboration.webhook.repository.WebhookConfigRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class WebhookService {

    private static final int MAX_WEBHOOKS_PER_TENANT = 10;

    private final WebhookConfigRepository webhookConfigRepository;

    public WebhookService(WebhookConfigRepository webhookConfigRepository) {
        this.webhookConfigRepository = webhookConfigRepository;
    }

    @Transactional(readOnly = true)
    public Page<WebhookConfig> listForTenant(Pageable pageable) {
        return webhookConfigRepository.findByTenantIdOrderByCreatedAtDesc(TenantContext.getTenantId(), pageable);
    }

    @Transactional(readOnly = true)
    public WebhookConfig getById(UUID id) {
        return webhookConfigRepository.findByIdAndTenantId(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Webhook not found"));
    }

    @Transactional
    public WebhookConfig create(@Valid WebhookUpsertRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        long count = webhookConfigRepository.countByTenantId(tenantId);
        if (count >= MAX_WEBHOOKS_PER_TENANT) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Maximum number of webhooks reached for tenant");
        }
        WebhookConfig config = new WebhookConfig();
        config.setTenantId(tenantId);
        applyRequest(config, request);
        OffsetDateTime now = OffsetDateTime.now();
        config.setCreatedAt(now);
        config.setUpdatedAt(now);
        return webhookConfigRepository.save(config);
    }

    @Transactional
    public WebhookConfig update(UUID id, @Valid WebhookUpsertRequest request) {
        WebhookConfig existing = getById(id);
        applyRequest(existing, request);
        existing.setUpdatedAt(OffsetDateTime.now());
        return webhookConfigRepository.save(existing);
    }

    @Transactional
    public void delete(UUID id) {
        WebhookConfig existing = getById(id);
        webhookConfigRepository.delete(existing);
    }

    private void applyRequest(WebhookConfig target, WebhookUpsertRequest request) {
        target.setName(request.name().trim());
        target.setUrl(request.url().trim());
        target.setSecret(request.secret().trim());
        target.setEvents(request.events());
        target.setActive(Boolean.TRUE.equals(request.active()));
    }

    public record WebhookUpsertRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Size(max = 500) String url,
            @NotBlank @Size(max = 200) String secret,
            @NotEmpty List<WebhookEvent> events,
            Boolean active
    ) {}
}

