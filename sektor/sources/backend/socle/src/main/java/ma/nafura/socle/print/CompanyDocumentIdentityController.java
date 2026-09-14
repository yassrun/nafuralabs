package ma.nafura.socle.print;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import ma.nafura.platform.appsettings.domain.model.TenantSetting;
import ma.nafura.platform.appsettings.repository.TenantSettingRepository;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.collaboration.docmanager.template.DefaultTenantIdentityProvider;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/** Persists the company.* values already consumed by Sektor's document identity provider. */
@RestController
@RequestMapping("/api/v1/socle/company-document-identity")
public class CompanyDocumentIdentityController {
    private final TenantSettingRepository repository;
    private final SektorTenantIdentityProvider identity;
    private final DefaultTenantIdentityProvider fallback;

    public CompanyDocumentIdentityController(TenantSettingRepository repository,
            SektorTenantIdentityProvider identity, DefaultTenantIdentityProvider fallback) {
        this.repository = repository;
        this.identity = identity;
        this.fallback = fallback;
    }

    private Set<String> fields() {
        return identity.describe().stream().map(f -> f.getPath().substring(7))
                .filter(f -> !f.equals("logo")).collect(Collectors.toSet());
    }

    @GetMapping
    @RequirePermission(value = "tenant.settings.read", fullPermission = true)
    public Map<String, String> get() {
        UUID tenantId = TenantContext.getTenantId();
        Map<String, Object> values = new LinkedHashMap<>(fallback.identity(tenantId));
        values.putAll(identity.identity(tenantId));
        Map<String, String> result = new LinkedHashMap<>();
        fields().forEach(field -> result.put(field, String.valueOf(values.getOrDefault(field, ""))));
        return result;
    }

    @PutMapping
    @Transactional
    @RequirePermission(value = "tenant.settings.write", fullPermission = true)
    public Map<String, String> save(@RequestBody Map<String, String> payload) {
        Set<String> allowed = fields();
        if (!allowed.containsAll(payload.keySet()) || payload.values().stream()
                .anyMatch(v -> v == null || v.length() > 1000)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Identité société invalide");
        }
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        payload.forEach((field, value) -> {
            String key = "company." + field;
            TenantSetting row = repository.findByTenantIdAndSettingKey(tenantId, key)
                .orElseGet(() -> TenantSetting.builder().tenantId(tenantId).settingKey(key).build());
            row.setValue(value.trim());
            repository.save(row);
        });
        return get();
    }
}
