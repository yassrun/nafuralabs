-- SEKTOR-223 — nœud facultatif sur un document de chantier (pas d'orphelin : chantier obligatoire déjà).
ALTER TABLE documents_chantier
    ADD COLUMN IF NOT EXISTS noeud_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_documents_chantier_tenant_noeud
    ON documents_chantier (tenant_id, noeud_id);
