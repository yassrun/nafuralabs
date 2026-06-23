ALTER TABLE documents_chantier
    ADD COLUMN IF NOT EXISTS storage_key VARCHAR(1000);
