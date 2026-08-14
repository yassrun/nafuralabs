-- Auto-generated from costing-method.entity.json
-- Do not edit manually — regenerate with: node generate.mjs --entity costing-method --feature stock

CREATE TABLE IF NOT EXISTS costing_methods (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL,
    code           VARCHAR(60) NOT NULL,
    name           VARCHAR(120),
    description    VARCHAR(2000),
    method         VARCHAR(120),
    allow_negative_stock BOOLEAN,
    status         VARCHAR(30) NOT NULL DEFAULT 'Draft',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_costing_methods_tenant ON costing_methods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_costing_methods_code ON costing_methods(tenant_id, code);
CREATE UNIQUE INDEX IF NOT EXISTS uq_costing_methods_code_tenant ON costing_methods(tenant_id, code);
CREATE INDEX IF NOT EXISTS idx_costing_methods_status ON costing_methods(tenant_id, status);
