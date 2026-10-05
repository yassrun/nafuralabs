-- Notes become a record (audit columns of TenantEntity); items can be published in the public catalogue,
-- confidential ones withheld, with the supplier shown on the public fiche.
ALTER TABLE demo_note ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE demo_note ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE demo_note ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE demo_item ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE demo_item ADD COLUMN IF NOT EXISTS confidential BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE demo_item ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(160);
