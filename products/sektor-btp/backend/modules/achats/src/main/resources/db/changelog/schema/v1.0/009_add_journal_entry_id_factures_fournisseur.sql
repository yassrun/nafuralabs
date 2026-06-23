ALTER TABLE factures_fournisseur
    ADD COLUMN IF NOT EXISTS journal_entry_id UUID;

CREATE INDEX IF NOT EXISTS idx_factures_fournisseur_journal_entry
    ON factures_fournisseur(tenant_id, journal_entry_id)
    WHERE journal_entry_id IS NOT NULL;
