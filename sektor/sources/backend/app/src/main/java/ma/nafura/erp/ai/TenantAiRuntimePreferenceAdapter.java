package ma.nafura.erp.ai;

import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.ai.llm.provider.AiRuntimePreferencePort;
import ma.nafura.platform.appsettings.domain.model.TenantSetting;
import ma.nafura.platform.appsettings.repository.TenantSettingRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
public class TenantAiRuntimePreferenceAdapter implements AiRuntimePreferencePort {

    public static final String KEY_PROVIDER = "app.ai.provider";
    public static final String KEY_MODEL = "app.ai.model";

    private final TenantSettingRepository tenantSettingRepository;

    @Override
    public Optional<String> providerForTenant(String tenantId) {
        return read(tenantId, KEY_PROVIDER);
    }

    @Override
    public Optional<String> modelForTenant(String tenantId) {
        return read(tenantId, KEY_MODEL);
    }

    @Override
    @Transactional
    public void save(String tenantId, String provider, String model) {
        UUID id = UUID.fromString(tenantId);
        upsert(id, KEY_PROVIDER, provider);
        upsert(id, KEY_MODEL, model);
    }

    private Optional<String> read(String tenantId, String key) {
        if (!StringUtils.hasText(tenantId)) {
            return Optional.empty();
        }
        try {
            UUID id = UUID.fromString(tenantId.trim());
            return tenantSettingRepository.findByTenantIdAndSettingKey(id, key)
                .map(TenantSetting::getValue)
                .filter(StringUtils::hasText)
                .map(String::trim);
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
    }

    private void upsert(UUID tenantId, String key, String value) {
        if (!StringUtils.hasText(value)) {
            tenantSettingRepository.findByTenantIdAndSettingKey(tenantId, key)
                .ifPresent(tenantSettingRepository::delete);
            return;
        }
        TenantSetting setting = tenantSettingRepository.findByTenantIdAndSettingKey(tenantId, key)
            .orElseGet(() -> {
                TenantSetting t = new TenantSetting();
                t.setTenantId(tenantId);
                t.setSettingKey(key);
                return t;
            });
        setting.setValue(value.trim());
        tenantSettingRepository.save(setting);
    }
}
