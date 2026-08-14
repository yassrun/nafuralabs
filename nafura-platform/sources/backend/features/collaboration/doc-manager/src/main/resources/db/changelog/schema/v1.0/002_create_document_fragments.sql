-- Doc-manager: reusable document blocks (shared header / footer).
--
-- Templates reference them with th:replace="~{fragment :: CODE}" so the company letterhead is
-- edited once instead of being copied into every template body.

CREATE TABLE IF NOT EXISTS document_fragments (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  UUID NOT NULL,
    code       VARCHAR(60) NOT NULL,
    name       VARCHAR(200) NOT NULL,
    body       TEXT,
    scope      VARCHAR(20),
    is_system  BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_fragments_tenant ON document_fragments(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_document_fragments_tenant_code
    ON document_fragments(tenant_id, code);
