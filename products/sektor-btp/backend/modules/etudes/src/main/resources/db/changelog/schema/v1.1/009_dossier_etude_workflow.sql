-- Workflow étude : révision bordereau, étape d'approbation N+1/N+2, lien devis ↔ dossier.

ALTER TABLE dossiers_etude
    ADD COLUMN IF NOT EXISTS bordereau_revision INTEGER NOT NULL DEFAULT 1;

ALTER TABLE dossiers_etude
    ADD COLUMN IF NOT EXISTS validation_etape VARCHAR(10);

ALTER TABLE dossiers_etude
    ADD COLUMN IF NOT EXISTS approval_request_id VARCHAR(100);

ALTER TABLE devis
    ADD COLUMN IF NOT EXISTS dossier_etude_id UUID;

CREATE INDEX IF NOT EXISTS idx_devis_dossier_etude
    ON devis (tenant_id, dossier_etude_id)
    WHERE dossier_etude_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dossiers_etude_approval_request
    ON dossiers_etude (tenant_id, approval_request_id)
    WHERE approval_request_id IS NOT NULL;
