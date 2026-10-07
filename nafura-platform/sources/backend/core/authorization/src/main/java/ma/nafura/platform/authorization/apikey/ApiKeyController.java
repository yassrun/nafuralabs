package ma.nafura.platform.authorization.apikey;

import java.util.Set;
import java.util.UUID;

import ma.nafura.platform.authorization.domain.model.ApiKey;
import ma.nafura.platform.authorization.repository.ApiKeyRepository;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.framework.record.RecordController;
import ma.nafura.platform.framework.record.RecordRepository;
import ma.nafura.platform.framework.record.RecordRuleException;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * API keys of the organization, a record: creating one issues the key (shown once), {@code /revoke} turns it off,
 * deleting is for revoked keys only. Permissions: administration.integrations.api-keys.{read,create,update,delete}.
 */
@RestController
@RequestMapping("/api/v1/platform/admin/api-keys")
@SecuredResource(domain = "administration", feature = "integrations", resource = "api-keys")
public class ApiKeyController extends RecordController<ApiKey> {

    private final ApiKeyService apiKeys;
    private final ApiKeyRepository repository;

    public ApiKeyController(ApiKeyService apiKeys, ApiKeyRepository repository) {
        this.apiKeys = apiKeys;
        this.repository = repository;
    }

    @Override protected RecordRepository<ApiKey> repository() { return repository; }
    @Override protected String recordResource() { return "records/api-key.json"; }
    @Override protected String labelField() { return "name"; }

    @Override
    protected Set<String> readOnlyFields() {
        return Set.of("keyHash", "keyPrefix", "lastUsedAt", "active", "plainKey");
    }

    @Override
    protected void beforeSave(ApiKey key, ApiKey previous) {
        if (previous == null) {
            apiKeys.issue(key);
        } else {
            key.setPermissions(apiKeys.withinIssuer(key.getPermissions()));
        }
    }

    @Override
    protected void beforeDelete(ApiKey key) {
        if (key.isActive()) {
            throw RecordRuleException.refused("Révoquez la clé avant de la supprimer");
        }
    }

    /** Turns the key off at once; it stays listed as revoked. */
    @PostMapping("/{id}/revoke")
    @RequirePermission("update")
    @Transactional
    public ApiKey revoke(@PathVariable UUID id) {
        ApiKey key = find(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "API key not found"));
        key.setActive(false);
        return repository.save(key);
    }
}
