-- Auto-generated from code-list.entity.json
-- Do not edit manually — regenerate with: node generate.mjs --entity code-list --feature sysconfig

CREATE TABLE IF NOT EXISTS code_list (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL,
    code           VARCHAR(50) NOT NULL,
    name           VARCHAR(200) NOT NULL,
    description    TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_code_list_tenant ON code_list(tenant_id);
CREATE INDEX IF NOT EXISTS idx_code_list_code ON code_list(tenant_id, code);
