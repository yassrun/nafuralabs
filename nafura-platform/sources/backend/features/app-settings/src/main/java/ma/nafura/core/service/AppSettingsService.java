package ma.nafura.platform.appsettings.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.appsettings.api.request.UpdateBrandingRequest;
import ma.nafura.platform.appsettings.api.request.UpdateGeneralRequest;
import ma.nafura.platform.appsettings.api.request.UpdateLocalizationRequest;
import ma.nafura.platform.appsettings.api.response.AppBrandingSettingsResponse;
import ma.nafura.platform.appsettings.api.response.AppGeneralSettingsResponse;
import ma.nafura.platform.appsettings.api.response.AppLocalizationSettingsResponse;
import ma.nafura.platform.appsettings.domain.model.TenantAsset;
import ma.nafura.platform.appsettings.domain.model.TenantSetting;
import ma.nafura.platform.appsettings.repository.TenantAssetRepository;
import ma.nafura.platform.appsettings.repository.TenantSettingRepository;
import ma.nafura.platform.tenancy.domain.model.Tenant;
import ma.nafura.platform.tenancy.repository.TenantRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AppSettingsService {

    private static final String PREFIX_GENERAL = "app.general.";
    private static final String PREFIX_LOCALIZATION = "app.localization.";
    private static final String PREFIX_BRANDING = "app.branding.";

    private final TenantSettingRepository tenantSettingRepository;
    private final TenantAssetRepository tenantAssetRepository;
    private final TenantRepository tenantRepository;
    private final ObjectMapper objectMapper;

    public AppGeneralSettingsResponse getGeneral() {
        UUID tenantId = TenantContext.getTenantId();
        Map<String, String> map = getSettingsMap(tenantId, PREFIX_GENERAL);
        Tenant tenant = tenantRepository.findById(tenantId).orElse(null);
        return new AppGeneralSettingsResponse(
            map.getOrDefault("tenantName", tenant != null ? tenant.getName() : ""),
            map.get("contactEmail"),
            map.get("supportEmail"),
            map.getOrDefault("timezone", "UTC")
        );
    }

    @Transactional
    public AppGeneralSettingsResponse updateGeneral(UpdateGeneralRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        Tenant tenant = tenantRepository.findById(tenantId).orElseThrow();
        tenant.setName(request.tenantName());
        tenantRepository.save(tenant);
        setSetting(tenantId, "app.general.tenantName", request.tenantName());
        setSetting(tenantId, "app.general.timezone", request.timezone());
        setSetting(tenantId, "app.general.contactEmail", request.contactEmail());
        setSetting(tenantId, "app.general.supportEmail", request.supportEmail());
        return getGeneral();
    }

    public AppLocalizationSettingsResponse getLocalization() {
        UUID tenantId = TenantContext.getTenantId();
        Map<String, String> map = getSettingsMap(tenantId, PREFIX_LOCALIZATION);
        List<String> supportedLocales = parseList(map.get("supportedLocales"), List.of("en"));
        return new AppLocalizationSettingsResponse(
            map.getOrDefault("defaultLocale", "en"),
            supportedLocales,
            map.get("defaultCurrency"),
            map.get("dateFormat"),
            map.get("numberFormat")
        );
    }

    @Transactional
    public AppLocalizationSettingsResponse updateLocalization(UpdateLocalizationRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        setSetting(tenantId, "app.localization.defaultLocale", request.defaultLocale());
        setSetting(tenantId, "app.localization.supportedLocales", toJson(request.supportedLocales()));
        setSetting(tenantId, "app.localization.defaultCurrency", request.defaultCurrency());
        setSetting(tenantId, "app.localization.dateFormat", request.dateFormat());
        setSetting(tenantId, "app.localization.numberFormat", request.numberFormat());
        return getLocalization();
    }

    public AppBrandingSettingsResponse getBranding() {
        UUID tenantId = TenantContext.getTenantId();
        Map<String, String> map = getSettingsMap(tenantId, PREFIX_BRANDING);
        String logoUrl = map.get("logoUrl");
        String faviconUrl = map.get("faviconUrl");
        if (logoUrl == null && tenantAssetRepository.findByTenantIdAndAssetType(tenantId, "logo").isPresent()) {
            logoUrl = "/api/v1/app-settings/branding/assets/logo";
        }
        if (faviconUrl == null && tenantAssetRepository.findByTenantIdAndAssetType(tenantId, "favicon").isPresent()) {
            faviconUrl = "/api/v1/app-settings/branding/assets/favicon";
        }
        return new AppBrandingSettingsResponse(
            logoUrl,
            faviconUrl,
            map.get("primaryColor"),
            map.get("tenantDisplayName")
        );
    }

    @Transactional
    public AppBrandingSettingsResponse updateBranding(UpdateBrandingRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        setSetting(tenantId, "app.branding.logoUrl", request.logoUrl());
        setSetting(tenantId, "app.branding.faviconUrl", request.faviconUrl());
        setSetting(tenantId, "app.branding.primaryColor", request.primaryColor());
        setSetting(tenantId, "app.branding.tenantDisplayName", request.tenantDisplayName());
        return getBranding();
    }

    @Transactional
    public Map<String, String> uploadLogo(MultipartFile file) {
        return uploadAsset("logo", file);
    }

    @Transactional
    public Map<String, String> uploadFavicon(MultipartFile file) {
        return uploadAsset("favicon", file);
    }

    public Optional<AssetBody> getBrandingAsset(String assetType) {
        UUID tenantId = TenantContext.getTenantId();
        return tenantAssetRepository.findByTenantIdAndAssetType(tenantId, assetType)
            .map(a -> new AssetBody(
                a.getContentType() != null ? a.getContentType() : "application/octet-stream",
                a.getData() != null ? a.getData() : new byte[0]
            ));
    }

    private Map<String, String> uploadAsset(String assetType, MultipartFile file) {
        UUID tenantId = TenantContext.getTenantId();
        String contentType = file.getContentType();
        if (contentType == null) contentType = "application/octet-stream";
        byte[] data;
        try {
            data = file.getBytes();
        } catch (Exception e) {
            throw new RuntimeException("Failed to read file", e);
        }
        TenantAsset asset = tenantAssetRepository.findByTenantIdAndAssetType(tenantId, assetType)
            .orElseGet(() -> {
                TenantAsset a = new TenantAsset();
                a.setTenantId(tenantId);
                a.setAssetType(assetType);
                return a;
            });
        asset.setContentType(contentType);
        asset.setData(data);
        tenantAssetRepository.save(asset);
        String url = "/api/v1/app-settings/branding/assets/" + assetType;
        return Map.of("url", url);
    }

    private Map<String, String> getSettingsMap(UUID tenantId, String prefix) {
        return tenantSettingRepository.findByTenantId(tenantId).stream()
            .filter(s -> s.getSettingKey() != null && s.getSettingKey().startsWith(prefix))
            .collect(java.util.stream.Collectors.toMap(
                s -> s.getSettingKey().substring(prefix.length()),
                s -> s.getValue() != null ? s.getValue() : "",
                (a, b) -> b
            ));
    }

    private void setSetting(UUID tenantId, String key, String value) {
        if (value == null) {
            tenantSettingRepository.findByTenantIdAndSettingKey(tenantId, key).ifPresent(tenantSettingRepository::delete);
            return;
        }
        TenantSetting s = tenantSettingRepository.findByTenantIdAndSettingKey(tenantId, key)
            .orElseGet(() -> {
                TenantSetting t = new TenantSetting();
                t.setTenantId(tenantId);
                t.setSettingKey(key);
                return t;
            });
        s.setValue(value);
        tenantSettingRepository.save(s);
    }

    private String toJson(List<String> list) {
        try {
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            return "[\"en\"]";
        }
    }

    private List<String> parseList(String json, List<String> defaultVal) {
        if (json == null || json.isBlank()) return defaultVal;
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return defaultVal;
        }
    }

    public record AssetBody(String contentType, byte[] data) {}
}




