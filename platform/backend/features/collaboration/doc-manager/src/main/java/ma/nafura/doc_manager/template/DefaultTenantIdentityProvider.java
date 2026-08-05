package ma.nafura.platform.collaboration.docmanager.template;

import ma.nafura.platform.appsettings.domain.model.TenantAsset;
import ma.nafura.platform.appsettings.repository.TenantAssetRepository;
import ma.nafura.platform.collaboration.docmanager.api.response.TemplateVariableDescriptor;
import ma.nafura.platform.tenancy.domain.model.Tenant;
import ma.nafura.platform.tenancy.repository.TenantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static ma.nafura.platform.collaboration.docmanager.template.TemplateVariableCatalogService.desc;

/**
 * Platform fallback identity: everything the platform knows on its own, which is little.
 * Products holding a real legal identity register a provider with a lower {@link #order()}.
 */
@Component
public class DefaultTenantIdentityProvider implements TenantIdentityProvider {

    private final TenantRepository tenantRepository;
    private final TenantAssetRepository tenantAssetRepository;

    public DefaultTenantIdentityProvider(
            TenantRepository tenantRepository,
            @Autowired(required = false) TenantAssetRepository tenantAssetRepository) {
        this.tenantRepository = tenantRepository;
        this.tenantAssetRepository = tenantAssetRepository;
    }

    /** Runs last: any product provider takes precedence. */
    @Override
    public int order() {
        return Integer.MAX_VALUE;
    }

    @Override
    public Map<String, Object> identity(UUID tenantId) {
        Map<String, Object> tenant = new LinkedHashMap<>();
        if (tenantId == null) {
            return tenant;
        }
        try {
            Optional<Tenant> found = tenantRepository.findById(tenantId);
            if (found.isEmpty()) {
                return tenant;
            }
            Tenant t = found.get();
            tenant.put("name", t.getName());
            tenant.put("raisonSociale", t.getName());
            tenant.put("key", t.getKey());
            tenant.put("logo", resolveLogoDataUri(tenantId));
        } catch (Exception ignored) {
            // no tenant context or tenant not found: templates render without identity
        }
        return tenant;
    }

    @Override
    public List<TemplateVariableDescriptor> describe() {
        return List.of(
                desc("tenant.raisonSociale", "Raison sociale", "string", null),
                desc("tenant.name", "Nom", "string", null),
                desc("tenant.key", "Clé tenant", "string", null),
                desc("tenant.logo", "Logo", "image", null));
    }

    /**
     * Embed the logo as a data URI: the PDF renderer performs no authenticated HTTP call, and
     * outbound network access is blocked during rendering.
     */
    private String resolveLogoDataUri(UUID tenantId) {
        if (tenantAssetRepository == null) {
            return "";
        }
        try {
            Optional<TenantAsset> asset =
                    tenantAssetRepository.findByTenantIdAndAssetType(tenantId, "logo");
            if (asset.isEmpty() || asset.get().getData() == null || asset.get().getData().length == 0) {
                return "";
            }
            TenantAsset a = asset.get();
            String contentType = a.getContentType() != null && !a.getContentType().isBlank()
                    ? a.getContentType()
                    : "image/png";
            return "data:" + contentType + ";base64," + Base64.getEncoder().encodeToString(a.getData());
        } catch (Exception ignored) {
            return "";
        }
    }
}
