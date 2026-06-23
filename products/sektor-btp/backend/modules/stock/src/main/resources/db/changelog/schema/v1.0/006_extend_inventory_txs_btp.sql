ALTER TABLE inventory_txs ADD COLUMN IF NOT EXISTS source_location_id UUID;
ALTER TABLE inventory_txs ADD COLUMN IF NOT EXISTS dest_location_id UUID;
ALTER TABLE inventory_txs ADD COLUMN IF NOT EXISTS fournisseur_id UUID;
ALTER TABLE inventory_txs ADD COLUMN IF NOT EXISTS chantier_location_id UUID;
ALTER TABLE inventory_txs ADD COLUMN IF NOT EXISTS chantier_budget_id VARCHAR(50);
ALTER TABLE inventory_txs ADD COLUMN IF NOT EXISTS phase_ref VARCHAR(100);
ALTER TABLE inventory_txs ADD COLUMN IF NOT EXISTS motif_id UUID;
ALTER TABLE inventory_txs ADD COLUMN IF NOT EXISTS bc_id UUID;

CREATE INDEX IF NOT EXISTS idx_inventory_txs_tx_type ON inventory_txs(tenant_id, tx_type);
CREATE INDEX IF NOT EXISTS idx_inventory_txs_source_location ON inventory_txs(tenant_id, source_location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_txs_dest_location ON inventory_txs(tenant_id, dest_location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_txs_fournisseur ON inventory_txs(tenant_id, fournisseur_id);
