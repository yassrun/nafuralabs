-- Auto-generated from currency.entity.json
-- Do not edit manually — regenerate with: node generate.mjs --entity currency --feature currency

CREATE TABLE IF NOT EXISTS currencies (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL,
    code           VARCHAR(3) NOT NULL,
    name           VARCHAR(100) NOT NULL,
    symbol         VARCHAR(10),
    decimal_places INTEGER NOT NULL DEFAULT 2,
    is_active      BOOLEAN DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_currencies_tenant ON currencies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_currencies_code ON currencies(tenant_id, code);
CREATE UNIQUE INDEX IF NOT EXISTS uq_currencies_code_tenant ON currencies(tenant_id, code);
