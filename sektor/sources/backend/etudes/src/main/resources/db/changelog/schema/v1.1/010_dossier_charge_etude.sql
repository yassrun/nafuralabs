-- Chargé d'étude (user IAM avec rôle BTP_INGENIEUR).
ALTER TABLE dossiers_etude
    ADD COLUMN IF NOT EXISTS charge_etude_user_id VARCHAR(100);

ALTER TABLE dossiers_etude
    ADD COLUMN IF NOT EXISTS charge_etude_nom VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_dossiers_etude_charge_etude
    ON dossiers_etude (tenant_id, charge_etude_user_id)
    WHERE charge_etude_user_id IS NOT NULL;
