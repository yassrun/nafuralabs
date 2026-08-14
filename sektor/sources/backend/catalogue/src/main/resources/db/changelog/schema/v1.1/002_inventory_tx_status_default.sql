-- Stock Lot 2: align default status with code enums
-- Voir docs/epics/stock-raffinement/00-PLAN.md §5 Lot 2 / constat K

ALTER TABLE inventory_txs ALTER COLUMN status SET DEFAULT 'BROUILLON';

UPDATE inventory_txs SET status = 'BROUILLON' WHERE status = 'DRAFT' OR status IS NULL;
