-- Auto-generated from payment-term.entity.json
-- Do not edit manually — regenerate with: node generate.mjs --entity payment-term --feature currency

CREATE TABLE IF NOT EXISTS payment_terms (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL,
    code           VARCHAR(50) NOT NULL,
    name           VARCHAR(200) NOT NULL,
    days           INTEGER NOT NULL DEFAULT 0,
    discount_days  INTEGER,
    discount_percent NUMERIC(5,2),
    description    TEXT,
    is_active      BOOLEAN DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_terms_tenant ON payment_terms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_terms_code ON payment_terms(tenant_id, code);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_terms_code_tenant ON payment_terms(tenant_id, code);
