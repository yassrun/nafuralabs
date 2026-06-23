-- Auto-generated from reference-value.entity.json
-- Do not edit manually — regenerate with: node generate.mjs --entity reference-value --feature sysconfig

CREATE TABLE IF NOT EXISTS reference_value (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL,
    code_list_id   UUID NOT NULL,
    code           VARCHAR(50) NOT NULL,
    name           VARCHAR(200) NOT NULL,
    sort_order     INTEGER,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reference_value_tenant ON reference_value(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reference_value_code ON reference_value(tenant_id, code);
