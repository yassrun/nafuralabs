-- A role limited to one scope node (and its descendants) inside an organisation.

CREATE TABLE IF NOT EXISTS scope_grants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    user_id     UUID NOT NULL,
    role_code   VARCHAR(80) NOT NULL,
    entity      VARCHAR(120) NOT NULL,
    record_id   UUID NOT NULL,
    created_by  UUID,
    updated_by  UUID,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_scope_grants UNIQUE (tenant_id, user_id, role_code, entity, record_id)
);

CREATE INDEX IF NOT EXISTS idx_scope_grants_tenant_user ON scope_grants (tenant_id, user_id);
