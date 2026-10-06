-- BYOK (bring-your-own-key): per-tenant, per-provider encrypted API credential.
-- The secret is AES-GCM encrypted with the ops master key AI_CREDENTIALS_MASTER_KEY; never plaintext.

CREATE TABLE IF NOT EXISTS tenant_ai_credential (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    provider VARCHAR(50) NOT NULL,
    ciphertext TEXT NOT NULL,
    key_hint VARCHAR(8),
    updated_at TIMESTAMP NOT NULL,
    updated_by VARCHAR(255)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_ai_credential_tenant_provider
    ON tenant_ai_credential(tenant_id, provider);
