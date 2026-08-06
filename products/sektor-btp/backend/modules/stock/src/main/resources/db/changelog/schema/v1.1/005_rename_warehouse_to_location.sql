-- Stock Lot 6: warehouse_id → location_id (constat G)
-- Voir docs/epics/stock-raffinement/00-PLAN.md §5 Lot 6

ALTER TABLE stock_balances RENAME COLUMN warehouse_id TO location_id;
DROP INDEX IF EXISTS idx_stock_balances_warehouse_id;
CREATE INDEX IF NOT EXISTS idx_stock_balances_location_id ON stock_balances (tenant_id, location_id);
DROP INDEX IF EXISTS uq_stock_balances_tenant_warehouse_item;
CREATE UNIQUE INDEX IF NOT EXISTS uq_stock_balances_tenant_location_item
    ON stock_balances (tenant_id, location_id, item_id);

ALTER TABLE inventory_txs RENAME COLUMN warehouse_id TO location_id;
DROP INDEX IF EXISTS idx_inventory_txs_warehouse_id;
CREATE INDEX IF NOT EXISTS idx_inventory_txs_location_id ON inventory_txs (tenant_id, location_id);
