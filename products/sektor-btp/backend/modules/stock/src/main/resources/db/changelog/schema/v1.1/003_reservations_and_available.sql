-- Stock Lot 4: réservations bloquantes — location_id + chantier UUID + drop available_quantity
-- Voir docs/epics/stock-raffinement/00-PLAN.md §5 Lot 4 / ADR

TRUNCATE TABLE stock_reservations;

ALTER TABLE stock_reservations DROP COLUMN IF EXISTS chantier_id;
ALTER TABLE stock_reservations ADD COLUMN chantier_id UUID NOT NULL;
ALTER TABLE stock_reservations ADD COLUMN IF NOT EXISTS location_id UUID NOT NULL;

DROP INDEX IF EXISTS idx_stock_reservations_chantier;
DROP INDEX IF EXISTS idx_stock_reservations_item;
CREATE INDEX IF NOT EXISTS idx_stock_reservations_chantier
    ON stock_reservations (tenant_id, chantier_id, status);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_item
    ON stock_reservations (tenant_id, item_id, chantier_id, status);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_location
    ON stock_reservations (tenant_id, location_id, status);

ALTER TABLE stock_balances DROP COLUMN IF EXISTS available_quantity;
