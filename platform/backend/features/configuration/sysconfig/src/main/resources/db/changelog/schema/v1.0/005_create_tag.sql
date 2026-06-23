-- Auto-generated from tag.entity.json
-- Do not edit manually — regenerate with: node generate.mjs --entity tag --feature sysconfig

CREATE TABLE IF NOT EXISTS tag (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL,
    code           VARCHAR(50) NOT NULL,
    name           VARCHAR(200) NOT NULL,
    color          VARCHAR(20),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tag_tenant ON tag(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tag_code ON tag(tenant_id, code);
CREATE UNIQUE INDEX IF NOT EXISTS uq_tag_code_tenant ON tag(tenant_id, code);
