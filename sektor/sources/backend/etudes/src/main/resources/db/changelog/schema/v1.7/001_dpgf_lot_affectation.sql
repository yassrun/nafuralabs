-- Chargé d'un lot DPGF : ingénieur BTP qui chiffre ce lot (et ses descendants).
ALTER TABLE dpgf_noeuds
    ADD COLUMN IF NOT EXISTS charge_lot_user_id VARCHAR(100);

ALTER TABLE dpgf_noeuds
    ADD COLUMN IF NOT EXISTS charge_lot_nom VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_dpgf_noeuds_charge_lot
    ON dpgf_noeuds (tenant_id, charge_lot_user_id)
    WHERE charge_lot_user_id IS NOT NULL;

COMMENT ON COLUMN dpgf_noeuds.charge_lot_user_id IS
    'User id (BTP_INGENIEUR) chargé du chiffrage de ce LOT. Ignoré hors type LOT.';
