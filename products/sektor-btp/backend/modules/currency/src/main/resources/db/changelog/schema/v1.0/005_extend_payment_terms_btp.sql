ALTER TABLE payment_terms
    ADD COLUMN IF NOT EXISTS term_type VARCHAR(30) NOT NULL DEFAULT 'DELAI_SIMPLE',
    ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS notes TEXT;

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
