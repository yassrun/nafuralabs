package ma.nafura.platform.ai.llm.provider;

import java.util.Optional;

/**
 * Optional port: active provider/model per tenant (admin UI).
 * When absent or empty, {@link ma.nafura.platform.ai.llm.config.LlmProviderConfig} env defaults apply.
 */
public interface AiRuntimePreferencePort {

    Optional<String> providerForTenant(String tenantId);

    Optional<String> modelForTenant(String tenantId);

    void save(String tenantId, String provider, String model);
}
