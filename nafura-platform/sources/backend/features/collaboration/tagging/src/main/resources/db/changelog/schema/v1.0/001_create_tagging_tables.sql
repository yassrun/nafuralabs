-- Tagging (collaboration): tags, entity_tags

CREATE TABLE IF NOT EXISTS tags (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    name        VARCHAR(100) NOT NULL,
    color       VARCHAR(20),
    category    VARCHAR(60),
    is_active   BOOLEAN,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tags_tenant ON tags(tenant_id);

CREATE TABLE IF NOT EXISTS entity_tags (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id   UUID NOT NULL,
    tag_id      UUID NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_entity_tags_tenant_entity ON entity_tags(tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_tags_tag ON entity_tags(tag_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_entity_tags_entity_tag ON entity_tags(tenant_id, entity_type, entity_id, tag_id);
