package ma.nafura.platform.authorization.apikey;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.authorization.domain.model.ApiKey;
import ma.nafura.platform.authorization.repository.ApiKeyRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApiKeyService {

    private final ApiKeyRepository apiKeyRepository;
    private final ApiKeyProperties apiKeyProperties;
    private final ApiKeyGenerator apiKeyGenerator;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Transactional
    public GeneratedApiKey createApiKey(String name, List<String> requestedPermissions, OffsetDateTime expiresAt) {
        UUID tenantId = TenantContext.getTenantId();
        UUID creatorId = UserContext.getUserId();

        long existing = apiKeyRepository.countByTenantIdAndActiveIsTrue(tenantId);
        if (existing >= apiKeyProperties.getMaxKeysPerTenant()) {
            throw new IllegalStateException("Maximum number of API keys reached for tenant");
        }

        String plainKey = apiKeyGenerator.generatePlainKey(apiKeyProperties.getRandomLength());
        String keyPrefix = apiKeyGenerator.extractPrefix(plainKey);

        Set<String> userPermissions = UserContext.getPermissions();
        String[] effectivePermissions = requestedPermissions == null
                ? new String[0]
                : requestedPermissions.stream()
                    .filter(userPermissions::contains)
                    .distinct()
                    .toArray(String[]::new);

        ApiKey apiKey = ApiKey.builder()
                .tenantId(tenantId)
                .name(name)
                .keyHash(passwordEncoder.encode(plainKey))
                .keyPrefix(keyPrefix)
                .permissions(effectivePermissions)
                .createdBy(creatorId)
                .expiresAt(expiresAt)
                .active(true)
                .build();

        apiKeyRepository.save(apiKey);

        return new GeneratedApiKey(apiKey, plainKey);
    }

    @Transactional(readOnly = true)
    public List<ApiKey> listForTenant(UUID tenantId) {
        return apiKeyRepository.findAll().stream()
                .filter(k -> tenantId.equals(k.getTenantId()))
                .toList();
    }

    @Transactional
    public void revoke(UUID tenantId, UUID id) {
        apiKeyRepository.findById(id)
                .filter(k -> tenantId.equals(k.getTenantId()))
                .ifPresent(k -> {
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

