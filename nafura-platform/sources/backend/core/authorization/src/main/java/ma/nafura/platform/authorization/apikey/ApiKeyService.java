package ma.nafura.platform.authorization.apikey;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.authorization.domain.model.ApiKey;
import ma.nafura.platform.authorization.repository.ApiKeyRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.platform.framework.record.RecordRuleException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApiKeyService {

    private final ApiKeyRepository apiKeyRepository;
    private final ApiKeyProperties apiKeyProperties;
    private final ApiKeyGenerator apiKeyGenerator;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /** Creates a key outside the API (assistant). The API goes through {@link ApiKeyController}, which calls {@link #issue}. */
    @Transactional
    public GeneratedApiKey createApiKey(String name, List<String> requestedPermissions, OffsetDateTime expiresAt) {
        ApiKey apiKey = new ApiKey();
        apiKey.setTenantId(TenantContext.getTenantId());
        apiKey.setName(name);
        apiKey.setPermissions(requestedPermissions == null ? new String[0] : requestedPermissions.toArray(String[]::new));
        apiKey.setExpiresAt(expiresAt);
        issue(apiKey);
        apiKeyRepository.save(apiKey);
        return new GeneratedApiKey(apiKey, apiKey.getPlainKey());
    }

    /** A new key: under the tenant's quota, permissions cut to the issuer's, hash stored, plain key set once. */
    void issue(ApiKey apiKey) {
        long existing = apiKeyRepository.countByTenantIdAndActiveIsTrue(apiKey.getTenantId());
        if (existing >= apiKeyProperties.getMaxKeysPerTenant()) {
            throw RecordRuleException.refused("Nombre maximal de clés actives atteint pour l’organisation");
        }
        String plainKey = apiKeyGenerator.generatePlainKey(apiKeyProperties.getRandomLength());
        apiKey.setPermissions(withinIssuer(apiKey.getPermissions()));
        apiKey.setKeyHash(passwordEncoder.encode(plainKey));
        apiKey.setKeyPrefix(apiKeyGenerator.extractPrefix(plainKey));
        apiKey.setActive(true);
        apiKey.setPlainKey(plainKey);
    }

    /** A key never exceeds whoever issues or edits it: same rule as the filter (exact, `*`, `prefix.*`). */
    String[] withinIssuer(String[] requested) {
        return requested == null
                ? new String[0]
                : Arrays.stream(requested).filter(UserContext::hasPermission).distinct().toArray(String[]::new);
    }

    @Transactional
    public void revoke(UUID tenantId, UUID id) {
        apiKeyRepository.findByIdAndTenantId(id, tenantId).ifPresent(k -> {
            k.setActive(false);
            apiKeyRepository.save(k);
        });
    }

    @Transactional
    public ApiKeyAuthenticationResult authenticate(String plainKey) {
        String prefix = apiKeyGenerator.extractPrefix(plainKey);
        if (prefix == null) {
            return null;
        }

        return apiKeyRepository.findByKeyPrefix(prefix)
                .filter(ApiKey::isActive)
                .filter(k -> k.getExpiresAt() == null || k.getExpiresAt().isAfter(OffsetDateTime.now()))
                .filter(k -> passwordEncoder.matches(plainKey, k.getKeyHash()))
                .map(k -> {
                    k.setLastUsedAt(OffsetDateTime.now());
                    apiKeyRepository.save(k);
                    return new ApiKeyAuthenticationResult(
                            k.getId(),
                            k.getTenantId(),
                            Arrays.asList(k.getPermissions())
                    );
                })
                .orElse(null);
    }

    public record GeneratedApiKey(ApiKey apiKey, String plainKey) {
    }

    public record ApiKeyAuthenticationResult(UUID id, UUID tenantId, List<String> permissions) {
    }
}
