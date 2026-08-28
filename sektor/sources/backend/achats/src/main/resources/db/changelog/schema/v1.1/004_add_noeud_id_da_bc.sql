-- SEKTOR-222 — DA et BC portent le nœud vendu (optionnel). Sans nœud = interne.
ALTER TABLE demandes_achat
    ADD COLUMN IF NOT EXISTS noeud_id VARCHAR(100);

ALTER TABLE bons_commande_achat
    ADD COLUMN IF NOT EXISTS noeud_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_demandes_achat_tenant_noeud
    ON demandes_achat (tenant_id, noeud_id);

CREATE INDEX IF NOT EXISTS idx_bons_commande_achat_tenant_noeud
    ON bons_commande_achat (tenant_id, noeud_id);
