package ma.nafura.platform.ai.llm.provider;

import ma.nafura.platform.ai.llm.model.LlmCallContext;
import ma.nafura.platform.ai.llm.model.LlmResponse;
import ma.nafura.platform.ai.llm.model.NormalizedLlmRequest;

import java.util.Optional;
import java.util.concurrent.CompletableFuture;

/**
 * Routes each LLM call to the tenant-selected provider (or env default).
 */
public class RoutingAiProvider implements AiProvider {

    private final AiProviderRegistry registry;
    private final Optional<AiRuntimePreferencePort> preferences;

    public RoutingAiProvider(AiProviderRegistry registry, Optional<AiRuntimePreferencePort> preferences) {
        this.registry = registry;
        this.preferences = preferences != null ? preferences : Optional.empty();
    }

    @Override
    public String getProviderName() {
        return "routing";
    }

    @Override
    public CompletableFuture<LlmResponse> call(NormalizedLlmRequest request, LlmCallContext context) {
        String tenantId = context != null ? context.getTenantId() : null;
        String providerName = resolveProviderName(tenantId);
        AiProvider delegate = registry.require(providerName);

        String model = resolveModel(tenantId, providerName, context);
        LlmCallContext enriched = enrich(context, model);
        return delegate.call(request, enriched);
    }

    public String resolveProviderName(String tenantId) {
        if (tenantId != null && preferences.isPresent()) {
            Optional<String> preferred = preferences.get().providerForTenant(tenantId);
            if (preferred.isPresent() && registry.has(preferred.get())) {
                return preferred.get().trim().toLowerCase();
            }
        }
        return registry.defaultProviderName();
    }

    public String resolveModel(String tenantId, String providerName, LlmCallContext context) {
        if (context != null && context.getModelOverride() != null && !context.getModelOverride().isBlank()) {
            return context.getModelOverride().trim();
        }
        if (tenantId != null && preferences.isPresent()) {
            Optional<String> preferred = preferences.get().modelForTenant(tenantId);
            if (preferred.isPresent() && !preferred.get().isBlank()) {
                return preferred.get().trim();
            }
        }
        return null;
    }

    private static LlmCallContext enrich(LlmCallContext context, String model) {
        if (context == null) {
            return LlmCallContext.builder().modelOverride(model).build();
        }
        if (model == null || model.isBlank()) {
            return context;
        }
        if (model.equals(context.getModelOverride())) {
            return context;
        }
        return LlmCallContext.builder()
            .applicationId(context.getApplicationId())
            .domainKey(context.getDomainKey())
            .featureKey(context.getFeatureKey())
            .resourceKey(context.getResourceKey())
            .actionKey(context.getActionKey())
            .mode(context.getMode())
            .conversationId(context.getConversationId())
            .messageId(context.getMessageId())
            .actorSub(context.getActorSub())
            .tenantId(context.getTenantId())
            .scopeType(context.getScopeType())
            .idempotencyKey(context.getIdempotencyKey())
            .modelOverride(model)
            .build();
    }
}
