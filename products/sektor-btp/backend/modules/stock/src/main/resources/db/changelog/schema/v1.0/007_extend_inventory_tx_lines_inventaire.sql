ALTER TABLE inventory_tx_lines ADD COLUMN IF NOT EXISTS theoretical_qty NUMERIC(18,4);
ALTER TABLE inventory_tx_lines ADD COLUMN IF NOT EXISTS counted_qty NUMERIC(18,4);
