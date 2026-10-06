package ma.nafura.platform.ai.llm.provider;

import ma.nafura.platform.ai.llm.model.LlmCallContext;
import ma.nafura.platform.ai.llm.model.LlmResponse;
import ma.nafura.platform.ai.llm.model.NormalizedLlmRequest;

import java.util.Optional;
import java.util.concurrent.CompletableFuture;

/**
 * Routes each LLM call to the tenant-selected provider (or env default) and injects the
 * tenant BYOK key (when present) before delegating.
 */
public class RoutingAiProvider implements AiProvider {

    private final AiProviderRegistry registry;
    private final Optional<AiRuntimePreferencePort> preferences;
    private final Optional<AiCredentialPort> credentials;

    public RoutingAiProvider(
        AiProviderRegistry registry,
        Optional<AiRuntimePreferencePort> preferences,
        Optional<AiCredentialPort> credentials
    ) {
        this.registry = registry;
        this.preferences = preferences != null ? preferences : Optional.empty();
        this.credentials = credentials != null ? credentials : Optional.empty();
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
        String apiKey = resolveApiKey(tenantId, providerName);
        LlmCallContext enriched = enrich(context, model, apiKey);
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

    /** Tenant BYOK key wins over the provider's platform key; {@code null} means fall back. */
    public String resolveApiKey(String tenantId, String providerName) {
        if (tenantId != null && credentials.isPresent()) {
            Optional<String> key = credentials.get().apiKeyForTenant(tenantId, providerName);
            if (key.isPresent() && !key.get().isBlank()) {
                return key.get();
            }
        }
        return null;
    }

    private static LlmCallContext enrich(LlmCallContext context, String model, String apiKey) {
        LlmCallContext source = context != null ? context : LlmCallContext.builder().build();
        return LlmCallContext.builder()
            .applicationId(source.getApplicationId())
            .domainKey(source.getDomainKey())
            .featureKey(source.getFeatureKey())
            .resourceKey(source.getResourceKey())
            .actionKey(source.getActionKey())
            .mode(source.getMode())
            .conversationId(source.getConversationId())
            .messageId(source.getMessageId())
            .actorSub(source.getActorSub())
            .tenantId(source.getTenantId())
            .scopeType(source.getScopeType())
            .idempotencyKey(source.getIdempotencyKey())
            .modelOverride(model)
            .apiKeyOverride(apiKey)
            .build();
    }
}
