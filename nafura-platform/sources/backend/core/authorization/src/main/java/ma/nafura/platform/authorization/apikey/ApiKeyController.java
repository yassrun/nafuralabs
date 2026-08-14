package ma.nafura.platform.authorization.apikey;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import ma.nafura.platform.authorization.domain.model.ApiKey;
import ma.nafura.platform.authorization.repository.ApiKeyRepository;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/platform/admin/api-keys")
@SecuredResource(domain = "administration", feature = "administration", resource = "api-keys")
public class ApiKeyController {

    private final ApiKeyService apiKeyService;
    private final ApiKeyRepository apiKeyRepository;

    public ApiKeyController(ApiKeyService apiKeyService, ApiKeyRepository apiKeyRepository) {
        this.apiKeyService = apiKeyService;
        this.apiKeyRepository = apiKeyRepository;
    }

    @GetMapping
    @RequirePermission(value = "administration.api-keys.read", fullPermission = true)
    public Page<ApiKeyDto> list(Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        return apiKeyRepository.findByTenantIdOrderByCreatedAtDesc(tenantId, pageable)
                .map(ApiKeyController::toDto);
    }

    @PostMapping
    @RequirePermission(value = "administration.api-keys.write", fullPermission = true)
    public ResponseEntity<CreateApiKeyResponse> create(@Valid @RequestBody CreateApiKeyRequest request) {
        ApiKeyService.GeneratedApiKey generated = apiKeyService.createApiKey(
                request.name(),
                request.permissions() != null ? request.permissions() : List.of(),
                request.expiresAt()
        );
        return ResponseEntity.ok(new CreateApiKeyResponse(toDto(generated.apiKey()), generated.plainKey()));
    }

    @DeleteMapping("/{id}")
    @RequirePermission(value = "administration.api-keys.write", fullPermission = true)
    public ResponseEntity<Void> revoke(@PathVariable UUID id) {
        apiKeyService.revoke(TenantContext.getTenantId(), id);
        return ResponseEntity.noContent().build();
    }

    private static ApiKeyDto toDto(ApiKey apiKey) {
        return new ApiKeyDto(
                apiKey.getId(),
                apiKey.getTenantId(),
                apiKey.getName(),
                apiKey.getKeyPrefix(),
                apiKey.getPermissions() != null ? List.of(apiKey.getPermissions()) : List.of(),
                apiKey.getCreatedBy(),
                apiKey.getExpiresAt(),
                apiKey.getLastUsedAt(),
                apiKey.isActive(),
                apiKey.getCreatedAt(),
                apiKey.getUpdatedAt()
        );
    }

    public record CreateApiKeyRequest(
            @NotBlank @Size(max = 100) String name,
            List<String> permissions,
            OffsetDateTime expiresAt
    ) {}

    public record ApiKeyDto(
            UUID id,
            UUID tenantId,
            String name,
            String keyPrefix,
            List<String> permissions,
            UUID createdBy,
            OffsetDateTime expiresAt,
            OffsetDateTime lastUsedAt,
            boolean active,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt
    ) {}

    public record CreateApiKeyResponse(ApiKeyDto apiKey, String plainKey) {}
}

