-- Comment: record_comments

CREATE TABLE IF NOT EXISTS record_comments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id   UUID NOT NULL,
    author      VARCHAR(120) NOT NULL,
    body        TEXT NOT NULL,
    is_internal BOOLEAN,
    parent_id   UUID,
    edited_at   TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_record_comments_tenant_entity ON record_comments(tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_record_comments_parent ON record_comments(parent_id);
