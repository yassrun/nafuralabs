-- Devis: référentiel contact partenaire (UUID) + denorm libellé contact_client.
ALTER TABLE devis
    ADD COLUMN IF NOT EXISTS contact_client_id UUID;

CREATE INDEX IF NOT EXISTS idx_devis_contact_client
    ON devis (tenant_id, contact_client_id)
    WHERE contact_client_id IS NOT NULL;
