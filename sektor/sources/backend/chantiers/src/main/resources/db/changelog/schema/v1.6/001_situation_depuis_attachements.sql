-- Contrat situation-et-retenues — AC-1 à AC-7.
--
-- La situation se monte depuis les attachements signés, plus depuis AvancementPhysique ni
-- ChantierLot.quantite. Une ligne de situation pointe un nœud (poste ou lot-feuille), comme une
-- ligne d'attachement — le grain « lot seul » disparaît. Lab métier : schéma clean, pas de
-- migration de données (les situations existantes sur l'ancien modèle ne sont pas reprises).

-- AC-4 — un attachement signé n'est consommé que par une seule situation.
ALTER TABLE attachements_chantier
    ADD COLUMN IF NOT EXISTS situation_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_attachements_chantier_situation
    ON attachements_chantier (situation_id);

-- AC-2 — la ligne pointe un nœud, plus un lot seul.
ALTER TABLE situation_lignes DROP CONSTRAINT IF EXISTS fk_situation_lignes_lot;
ALTER TABLE situation_lignes DROP CONSTRAINT IF EXISTS fk_situation_lignes_poste;
ALTER TABLE situation_lignes DROP COLUMN IF EXISTS lot_id;
ALTER TABLE situation_lignes DROP COLUMN IF EXISTS poste_budgetaire_id;

ALTER TABLE situation_lignes ADD COLUMN IF NOT EXISTS noeud_id VARCHAR(100);
ALTER TABLE situation_lignes ADD COLUMN IF NOT EXISTS code VARCHAR(120);

-- AC-3 — la quantité de la ligne est la quantité de la période (somme des attachements
-- consommés), distincte du cumul affiché à titre de contexte.
ALTER TABLE situation_lignes ADD COLUMN IF NOT EXISTS quantite_periode NUMERIC(18, 4) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_situation_lignes_tenant_noeud
    ON situation_lignes (tenant_id, noeud_id);

DROP INDEX IF EXISTS idx_situation_lignes_tenant_lot;

-- AC-8 — pénalités de retard, montant saisi, zéro par défaut.
ALTER TABLE situations_travaux ADD COLUMN IF NOT EXISTS penalites_retard_ht NUMERIC(18, 4) NOT NULL DEFAULT 0;

-- AC-9 — RAS dérivée de Chantier.tauxRas, jamais saisie, purement informative.
ALTER TABLE situations_travaux ADD COLUMN IF NOT EXISTS ras_taux NUMERIC(8, 4);
ALTER TABLE situations_travaux ADD COLUMN IF NOT EXISTS ras_montant NUMERIC(18, 4) NOT NULL DEFAULT 0;
