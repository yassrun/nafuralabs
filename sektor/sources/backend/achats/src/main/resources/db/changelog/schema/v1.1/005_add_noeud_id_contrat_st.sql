-- SEKTOR-224 — contrat ST accroché à un nœud vendu (BPU facultatif en nom de fichier).
ALTER TABLE contrats_fournisseur
    ADD COLUMN IF NOT EXISTS noeud_id VARCHAR(100);

ALTER TABLE contrats_fournisseur
    ADD COLUMN IF NOT EXISTS bpu_fichier VARCHAR(500);

CREATE INDEX IF NOT EXISTS idx_contrats_fournisseur_tenant_noeud
    ON contrats_fournisseur (tenant_id, noeud_id);
