package ma.nafura.platform.collaboration.docmanager.template;

import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.platform.tenancy.domain.model.Tenant;
import ma.nafura.platform.tenancy.repository.TenantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Resolves template variables from entity, tenant, and system context.
 */
@Service
public class TemplateVariableResolver {

    private final TenantRepository tenantRepository;

    @Autowired(required = false)
    private EntityDataProvider entityDataProvider;

    public TemplateVariableResolver(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    /**
     * Build the full variable map for Thymeleaf: entity, tenant, today, now, currentUser.
     */
    public Map<String, Object> resolve(String entityType, UUID entityId) {
        Map<String, Object> vars = new HashMap<>();

        vars.put("entity", fetchEntityData(entityType, entityId));
        vars.put("tenant", fetchTenantData());
        vars.put("today", LocalDate.now());
        vars.put("now", OffsetDateTime.now());
        vars.put("currentUser", UserContext.getUserEmail() != null ? UserContext.getUserEmail() : "");

        return vars;
    }

    /**
     * Build variable map for preview (sample entity data, real tenant/system).
     */
    public Map<String, Object> resolveForPreview(String entityType) {
        Map<String, Object> vars = new HashMap<>();
        vars.put("entity", generateSampleEntityData(entityType));
        vars.put("tenant", fetchTenantData());
        vars.put("today", LocalDate.now());
        vars.put("now", OffsetDateTime.now());
        vars.put("currentUser", UserContext.getUserEmail() != null ? UserContext.getUserEmail() : "");
        return vars;
    }

    private Map<String, Object> fetchEntityData(String entityType, UUID entityId) {
        if (entityDataProvider == null) {
            return new HashMap<>();
        }
        Map<String, Object> data = entityDataProvider.getEntityData(entityType, entityId);
        return data != null ? data : new HashMap<>();
    }

    private Map<String, Object> fetchTenantData() {
        Map<String, Object> tenant = new HashMap<>();
        try {
            UUID tenantId = TenantContext.getTenantId();
            Optional<Tenant> t = tenantRepository.findById(tenantId);
            if (t.isPresent()) {
                Tenant ten = t.get();
                tenant.put("name", ten.getName());
                tenant.put("key", ten.getKey());
                tenant.put("logo", "");   // optional: from app-settings / TenantAsset
                tenant.put("address", ""); // optional: from settings
            }
        } catch (Exception ignored) {
            // no tenant context or tenant not found
        }
        return tenant;
    }

    private Map<String, Object> generateSampleEntityData(String entityType) {
        Map<String, Object> sample = new HashMap<>();
        sample.put("code", "SAMPLE-001");
        sample.put("id", UUID.randomUUID().toString());
        sample.put("amount", "1500.00");
        sample.put("date", LocalDate.now().toString());
        // Nested sample for common patterns
        Map<String, Object> customer = new HashMap<>();
        customer.put("name", "Sample Customer");
        customer.put("address", "123 Sample St");
        sample.put("customer", customer);
        return sample;
    }
}
