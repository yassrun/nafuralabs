-- Auto-generated from inventory-tx.entity.json
-- Do not edit manually — regenerate with: node generate.mjs --entity inventory-tx --feature stock

CREATE TABLE IF NOT EXISTS inventory_txs (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL,
    tx_number      VARCHAR(50) NOT NULL,
    tx_type        VARCHAR(50) NOT NULL,
    warehouse_id   UUID NOT NULL,
    tx_date        DATE NOT NULL,
    reference      VARCHAR(100),
    status         VARCHAR(50) DEFAULT 'DRAFT',
    notes          TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_txs_tenant ON inventory_txs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_txs_tx_number ON inventory_txs(tenant_id, tx_number);
CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_txs_tx_number_tenant ON inventory_txs(tenant_id, tx_number);
CREATE INDEX IF NOT EXISTS idx_inventory_txs_warehouse_id ON inventory_txs(tenant_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_txs_tx_date ON inventory_txs(tenant_id, tx_date);
CREATE INDEX IF NOT EXISTS idx_inventory_txs_status ON inventory_txs(tenant_id, status);
