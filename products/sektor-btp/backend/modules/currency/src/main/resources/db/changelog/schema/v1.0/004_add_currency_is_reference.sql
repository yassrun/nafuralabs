ALTER TABLE currencies
    ADD COLUMN IF NOT EXISTS is_reference BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_currencies_reference ON currencies(tenant_id, is_reference)
    WHERE is_reference = true;
