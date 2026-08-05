package ma.nafura.platform.collaboration.docmanager.template;

import ma.nafura.platform.collaboration.docmanager.api.response.TemplateVariableDescriptor;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Resolves template variables from entity, tenant, and system context.
 */
@Service
public class TemplateVariableResolver {

    /** One provider per product module; resolved by {@link EntityDataProvider#supports(String)}. */
    private final List<EntityDataProvider> entityDataProviders;
    /** Merged lowest-order-first to build {@code tenant.*}. */
    private final List<TenantIdentityProvider> identityProviders;

    public TemplateVariableResolver(
            List<EntityDataProvider> entityDataProviders,
            List<TenantIdentityProvider> identityProviders) {
        this.entityDataProviders = entityDataProviders != null ? entityDataProviders : List.of();
        this.identityProviders = identityProviders != null ? identityProviders : List.of();
    }

    /** First provider declaring support for the type, or empty when none does. */
    Optional<EntityDataProvider> providerFor(String entityType) {
        if (entityType == null || entityType.isBlank()) {
            return Optional.empty();
        }
        return entityDataProviders.stream()
                .filter(p -> p.supports(entityType))
                .findFirst();
    }

    /**
     * Build the full variable map for Thymeleaf: entity, document, tenant, today, now, currentUser.
     */
    public Map<String, Object> resolve(String entityType, UUID entityId) {
        Map<String, Object> vars = commonVariables();
        vars.put("entity", fetchEntityData(entityType, entityId));
        vars.put(
                "document",
                providerFor(entityType)
                        .flatMap(p -> p.getDocument(entityType, entityId))
                        .orElse(null));
        return vars;
    }

    /**
     * Build variable map for preview (sample entity data, real tenant/system).
     */
    public Map<String, Object> resolveForPreview(String entityType) {
        Map<String, Object> vars = commonVariables();
        vars.put("entity", generateSampleEntityData(entityType));
        vars.put(
                "document",
                providerFor(entityType).flatMap(p -> p.getSampleDocument(entityType)).orElse(null));
        return vars;
    }

    private Map<String, Object> commonVariables() {
        Map<String, Object> vars = new HashMap<>();
        vars.put("tenant", fetchTenantData());
        vars.put("today", LocalDate.now());
        vars.put("now", OffsetDateTime.now());
        vars.put("currentUser", UserContext.getUserEmail() != null ? UserContext.getUserEmail() : "");
        return vars;
    }

    private Map<String, Object> fetchEntityData(String entityType, UUID entityId) {
        // Optional.map already drops a null result, so a missing or empty provider both
        // fall through to an empty map.
        return providerFor(entityType)
                .map(p -> p.getEntityData(entityType, entityId))
                .<Map<String, Object>>map(HashMap::new)
                .orElseGet(HashMap::new);
    }

    /**
     * Merge every identity provider, lowest {@code order()} first. A product provider that
     * knows the legal identity wins; the platform default only fills what is still missing,
     * so {@code tenant.logo} keeps working even when a product supplies the rest.
     */
    private Map<String, Object> fetchTenantData() {
        Map<String, Object> tenant = new LinkedHashMap<>();
        UUID tenantId;
        try {
            tenantId = TenantContext.getTenantId();
        } catch (Exception ignored) {
            return tenant;
        }
        if (tenantId == null) {
            return tenant;
        }
        for (TenantIdentityProvider provider : orderedIdentityProviders()) {
            try {
                Map<String, Object> identity = provider.identity(tenantId);
                if (identity == null) {
                    continue;
                }
                identity.forEach((key, value) -> {
                    Object existing = tenant.get(key);
                    if (existing == null || String.valueOf(existing).isBlank()) {
                        tenant.put(key, value);
                    }
                });
            } catch (Exception ignored) {
                // a failing provider must not break document rendering
            }
        }
        return tenant;
    }

    private List<TenantIdentityProvider> orderedIdentityProviders() {
        return identityProviders.stream()
                .sorted(Comparator.comparingInt(TenantIdentityProvider::order))
                .toList();
    }

    /** Catalog entries for {@code tenant.*}, derived from the same providers that fill them. */
    public List<TemplateVariableDescriptor> describeTenantVariables() {
        Map<String, TemplateVariableDescriptor> byPath = new LinkedHashMap<>();
        for (TenantIdentityProvider provider : orderedIdentityProviders()) {
            List<TemplateVariableDescriptor> described = provider.describe();
            if (described == null) {
                continue;
            }
            for (TemplateVariableDescriptor d : described) {
                byPath.putIfAbsent(d.getPath(), d);
            }
        }
        return List.copyOf(byPath.values());
    }

    private Map<String, Object> generateSampleEntityData(String entityType) {
        Optional<Map<String, Object>> fromProvider = providerFor(entityType)
                .map(p -> p.getSampleEntityData(entityType))
                .filter(s -> s != null && !s.isEmpty());
        if (fromProvider.isPresent()) {
            return fromProvider.get();
        }
        Map<String, Object> sample = new HashMap<>();
        sample.put("code", "SAMPLE-001");
        sample.put("id", UUID.randomUUID().toString());
        sample.put("amount", "1500.00");
        sample.put("date", LocalDate.now().toString());
        Map<String, Object> customer = new HashMap<>();
        customer.put("name", "Sample Customer");
        customer.put("address", "123 Sample St");
        sample.put("customer", customer);
        return sample;
    }
}
