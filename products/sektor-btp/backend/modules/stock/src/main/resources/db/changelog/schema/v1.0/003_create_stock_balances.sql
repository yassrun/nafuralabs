-- Auto-generated from stock-balance.entity.json
-- Do not edit manually — regenerate with: node generate.mjs --entity stock-balance --feature stock

CREATE TABLE IF NOT EXISTS stock_balances (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL,
    warehouse_id   UUID NOT NULL,
    item_id        UUID NOT NULL,
    quantity       NUMERIC(18,4) NOT NULL,
    reserved_quantity NUMERIC(18,4) DEFAULT 0,
    available_quantity NUMERIC(18,4),
    last_count_date DATE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_balances_tenant ON stock_balances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_balances_warehouse_id ON stock_balances(tenant_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_balances_item_id ON stock_balances(tenant_id, item_id);
