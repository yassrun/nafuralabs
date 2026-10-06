package ma.nafura.platform.ai.llm.provider;

import java.util.Optional;

/**
 * Port for tenant-scoped BYOK API keys. Implemented in a higher module that owns the
 * {@code tenant_ai_credential} persistence. When absent, calls fall back to platform env keys.
 */
public interface AiCredentialPort {

    /** Decrypted BYOK secret for the tenant/provider, or empty to fall back to the platform key. */
    Optional<String> apiKeyForTenant(String tenantId, String provider);
}
