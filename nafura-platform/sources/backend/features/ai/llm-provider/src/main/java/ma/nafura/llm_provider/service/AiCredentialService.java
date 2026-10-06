package ma.nafura.platform.ai.llm.service;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.ai.llm.catalog.AiProviderCatalog;
import ma.nafura.platform.ai.llm.domain.model.TenantAiCredential;
import ma.nafura.platform.ai.llm.provider.AiCredentialPort;
import ma.nafura.platform.ai.llm.repository.TenantAiCredentialRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * BYOK store: encrypt/decrypt per-tenant provider secrets and expose them to the routing runtime.
 * Secrets are never returned to the admin UI — only a last-4 {@code keyHint}.
 */
@Service
@RequiredArgsConstructor
public class AiCredentialService implements AiCredentialPort {

    private final TenantAiCredentialRepository repository;
    private final AiCredentialCipher cipher;

    @Override
    public Optional<String> apiKeyForTenant(String tenantId, String provider) {
        if (!cipher.configured()) {
            return Optional.empty();
        }
        UUID id = parse(tenantId);
        if (id == null) {
            return Optional.empty();
        }
        return repository.findByTenantIdAndProvider(id, AiProviderCatalog.normalize(provider))
            .map(c -> cipher.decrypt(c.getCiphertext()));
    }

    public Optional<String> keyHint(UUID tenantId, String provider) {
        if (tenantId == null) {
            return Optional.empty();
        }
        return repository.findByTenantIdAndProvider(tenantId, AiProviderCatalog.normalize(provider))
            .map(TenantAiCredential::getKeyHint);
    }

    public boolean hasCredential(UUID tenantId, String provider) {
        return tenantId != null
            && repository.findByTenantIdAndProvider(tenantId, AiProviderCatalog.normalize(provider)).isPresent();
    }

    @Transactional
    public void save(UUID tenantId, String provider, String secret, String actor) {
        if (!cipher.configured()) {
            throw new IllegalStateException("AI credentials master key is not configured");
        }
        if (secret == null || secret.isBlank()) {
            throw new IllegalArgumentException("Secret is required");
        }
        String normalized = AiProviderCatalog.normalize(provider);
        TenantAiCredential credential = repository
            .findByTenantIdAndProvider(tenantId, normalized)
            .orElseGet(() -> {
                TenantAiCredential c = new TenantAiCredential();
                c.setTenantId(tenantId);
                c.setProvider(normalized);
                return c;
            });
        credential.setCiphertext(cipher.encrypt(secret));
        credential.setKeyHint(hint(secret));
        credential.setUpdatedBy(actor);
        repository.save(credential);
    }

    @Transactional
    public void revoke(UUID tenantId, String provider) {
        if (tenantId != null) {
            repository.deleteByTenantIdAndProvider(tenantId, AiProviderCatalog.normalize(provider));
        }
    }

    private static String hint(String secret) {
        if (secret == null || secret.length() <= 4) {
            return secret;
        }
        return secret.substring(secret.length() - 4);
    }

    private static UUID parse(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(tenantId.trim());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
