-- Auto-generated from exchange-rate.entity.json
-- Do not edit manually — regenerate with: node generate.mjs --entity exchange-rate --feature currency

CREATE TABLE IF NOT EXISTS exchange_rates (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL,
    from_currency_id UUID NOT NULL,
    to_currency_id UUID NOT NULL,
    rate           NUMERIC(19,8) NOT NULL,
    effective_date DATE NOT NULL,
    source         VARCHAR(50),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_tenant ON exchange_rates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_from_currency_id ON exchange_rates(tenant_id, from_currency_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_to_currency_id ON exchange_rates(tenant_id, to_currency_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_effective_date ON exchange_rates(tenant_id, effective_date);
