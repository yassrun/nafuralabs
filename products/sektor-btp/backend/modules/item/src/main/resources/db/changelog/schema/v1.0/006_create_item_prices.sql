-- Auto-generated from item-price.entity.json
-- Do not edit manually — regenerate with: node generate.mjs --entity item-price --feature item

CREATE TABLE IF NOT EXISTS item_prices (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL,
    item_id        UUID NOT NULL,
    price_type     VARCHAR(30) NOT NULL,
    currency_id    UUID NOT NULL,
    unit_price     NUMERIC(19,4) NOT NULL,
    min_quantity   NUMERIC(19,4),
    effective_from DATE NOT NULL,
    effective_to   DATE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_item_prices_tenant ON item_prices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_item_prices_item_id ON item_prices(tenant_id, item_id);
CREATE INDEX IF NOT EXISTS idx_item_prices_currency_id ON item_prices(tenant_id, currency_id);
