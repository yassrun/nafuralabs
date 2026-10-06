package ma.nafura.platform.ai.llm.service;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.appsettings.domain.model.TenantSetting;
import ma.nafura.platform.appsettings.repository.TenantSettingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

/**
 * Reads tenant AI limits / privacy switches at call time and persists them from the admin API.
 * Backed by {@code tenant_setting} (already a {@code llm-provider} dependency).
 */
@Service
@RequiredArgsConstructor
public class TenantAiPolicyService {

    private final TenantSettingRepository settings;

    public AiRuntimePolicy policyFor(String tenantId) {
        UUID id = parse(tenantId);
        if (id == null) {
            return new AiRuntimePolicy(true, null, false);
        }
        boolean enabled = bool(id, AiSettings.KEY_ENABLED, true);
        BigDecimal budget = decimal(id, AiSettings.KEY_MONTHLY_BUDGET_USD);
        boolean retain = bool(id, AiSettings.KEY_RETAIN_PAYLOADS, false);
        return new AiRuntimePolicy(enabled, budget, retain);
    }

    @Transactional
    public void saveLimits(UUID tenantId, Boolean enabled, String monthlyBudgetUsd, Boolean retainPayloads) {
        upsert(tenantId, AiSettings.KEY_ENABLED, enabled == null ? null : String.valueOf(enabled));
        upsert(tenantId, AiSettings.KEY_MONTHLY_BUDGET_USD, normalizeDecimal(monthlyBudgetUsd));
        upsert(tenantId, AiSettings.KEY_RETAIN_PAYLOADS, retainPayloads == null ? null : String.valueOf(retainPayloads));
    }

    public record AiRuntimePolicy(boolean enabled, BigDecimal monthlyBudgetUsd, boolean retainPayloads) {}

    private boolean bool(UUID tenantId, String key, boolean fallback) {
        return read(tenantId, key)
            .map(v -> v.equalsIgnoreCase("true"))
            .orElse(fallback);
    }

    private BigDecimal decimal(UUID tenantId, String key) {
        return read(tenantId, key)
            .map(String::trim)
            .filter(StringUtils::hasText)
            .map(value -> {
                try {
                    return new BigDecimal(value);
                } catch (NumberFormatException e) {
                    return null;
                }
            })
            .orElse(null);
    }

    private Optional<String> read(UUID tenantId, String key) {
        if (tenantId == null) {
            return Optional.empty();
        }
        return settings.findByTenantIdAndSettingKey(tenantId, key)
            .map(TenantSetting::getValue)
            .filter(StringUtils::hasText)
            .map(String::trim);
    }

    private void upsert(UUID tenantId, String key, String value) {
        if (!StringUtils.hasText(value)) {
            settings.findByTenantIdAndSettingKey(tenantId, key)
                .ifPresent(settings::delete);
            return;
        }
        TenantSetting setting = settings.findByTenantIdAndSettingKey(tenantId, key)
            .orElseGet(() -> {
                TenantSetting t = new TenantSetting();
                t.setTenantId(tenantId);
                t.setSettingKey(key);
                return t;
            });
        setting.setValue(value.trim());
        settings.save(setting);
    }

    private static String normalizeDecimal(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            return new BigDecimal(value.trim()).stripTrailingZeros().toPlainString();
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static UUID parse(String tenantId) {
        if (!StringUtils.hasText(tenantId)) {
            return null;
        }
        try {
            return UUID.fromString(tenantId.trim());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
