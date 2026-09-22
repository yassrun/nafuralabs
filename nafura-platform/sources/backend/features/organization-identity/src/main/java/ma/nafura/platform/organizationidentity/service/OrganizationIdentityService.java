package ma.nafura.platform.organizationidentity.service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import ma.nafura.platform.appsettings.domain.model.TenantSetting;
import ma.nafura.platform.appsettings.repository.TenantSettingRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.organizationidentity.CompanyIdentityKeys;
import ma.nafura.platform.organizationidentity.api.dto.OrganizationIdentityDto;

@Service
public class OrganizationIdentityService {

    private final TenantSettingRepository settingRepository;

    public OrganizationIdentityService(TenantSettingRepository settingRepository) {
        this.settingRepository = settingRepository;
    }

    public OrganizationIdentityDto get() {
        UUID tenantId = requireTenantId();
        Map<String, String> settings = loadSettings(tenantId);
        Map<String, String> values = new LinkedHashMap<>();
        for (String field : CompanyIdentityKeys.FIELD_NAMES) {
            values.put(field, resolveField(settings, field));
        }
        return OrganizationIdentityDto.fromMap(values);
    }

    @Transactional
    public OrganizationIdentityDto save(OrganizationIdentityDto payload) {
        if (payload == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Identité organisation invalide");
        }
        Map<String, String> map = payload.toMap();
        for (String value : map.values()) {
            if (value.length() > 1000) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Identité organisation invalide");
            }
        }
        UUID tenantId = requireTenantId();
        map.forEach((field, value) -> upsert(tenantId, CompanyIdentityKeys.settingKey(field), value.trim()));
        return get();
    }

    private void upsert(UUID tenantId, String key, String value) {
        TenantSetting row = settingRepository
                .findByTenantIdAndSettingKey(tenantId, key)
                .orElseGet(() -> TenantSetting.builder().tenantId(tenantId).settingKey(key).build());
        row.setValue(value);
        settingRepository.save(row);
    }

    private Map<String, String> loadSettings(UUID tenantId) {
        Map<String, String> byKey = new LinkedHashMap<>();
        for (TenantSetting setting : settingRepository.findByTenantId(tenantId)) {
            byKey.put(setting.getSettingKey(), setting.getValue());
        }
        return byKey;
    }

    private static String resolveField(Map<String, String> settings, String field) {
        String primary = settings.get(CompanyIdentityKeys.settingKey(field));
        if (primary != null && !primary.isBlank()) {
            return primary;
        }
        return switch (field) {
            case "raisonSociale" -> blankToEmpty(settings.get(CompanyIdentityKeys.LEGACY_NOM));
            case "ice" -> blankToEmpty(settings.get(CompanyIdentityKeys.LEGACY_ICE));
            case "formeJuridique" -> blankToEmpty(settings.get(CompanyIdentityKeys.LEGACY_FORME));
            default -> "";
        };
    }

    private static String blankToEmpty(String value) {
        return value == null || value.isBlank() ? "" : value;
    }

    private static UUID requireTenantId() {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tenant requis");
        }
        return tenantId;
    }
}
