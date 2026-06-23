-- Auto-generated from inventory-tx-line.entity.json
-- Do not edit manually — regenerate with: node generate.mjs --entity inventory-tx-line --feature stock

CREATE TABLE IF NOT EXISTS inventory_tx_lines (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL,
    inventory_tx_id UUID NOT NULL,
    line_number    INTEGER NOT NULL,
    item_id        UUID NOT NULL,
    quantity       NUMERIC(18,4) NOT NULL,
    unit_price     NUMERIC(18,4),
    total_price    NUMERIC(18,4),
    notes          TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_tx_lines_tenant ON inventory_tx_lines(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_lines_inventory_tx_id ON inventory_tx_lines(tenant_id, inventory_tx_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_lines_item_id ON inventory_tx_lines(tenant_id, item_id);
