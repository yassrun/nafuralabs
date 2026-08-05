-- Doc-manager: per-tenant document customisation.
--
-- Structured settings, not markup: the header and footer fragments are regenerated from these
-- values so an administrator changes their letterhead without writing HTML.

CREATE TABLE IF NOT EXISTS document_settings (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL,
    -- NULL = tenant-wide defaults; set = override for that document type.
    entity_type   VARCHAR(80),
    settings_json TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_settings_tenant ON document_settings(tenant_id);

-- One defaults row per tenant. A partial index is required: NULLs are never equal, so a plain
-- unique constraint would let duplicate defaults rows through.
CREATE UNIQUE INDEX IF NOT EXISTS uq_document_settings_tenant_default
    ON document_settings(tenant_id) WHERE entity_type IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_document_settings_tenant_type
    ON document_settings(tenant_id, entity_type) WHERE entity_type IS NOT NULL;
