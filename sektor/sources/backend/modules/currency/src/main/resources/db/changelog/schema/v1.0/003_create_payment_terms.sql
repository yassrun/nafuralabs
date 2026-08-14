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
    term_type      VARCHAR(30) NOT NULL DEFAULT 'DELAI_SIMPLE',
    is_default     BOOLEAN NOT NULL DEFAULT false,
    notes          TEXT,
    is_active      BOOLEAN DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_terms_tenant ON payment_terms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_terms_code ON payment_terms(tenant_id, code);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_terms_code_tenant ON payment_terms(tenant_id, code);

CREATE TABLE IF NOT EXISTS payment_term_installments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    payment_term_id UUID NOT NULL,
    line_order      INTEGER NOT NULL,
    percentage      NUMERIC(5, 2) NOT NULL,
    days_offset     INTEGER NOT NULL DEFAULT 0,
    description     VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_term_installments_term
    ON payment_term_installments(tenant_id, payment_term_id);
