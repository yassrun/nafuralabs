-- Phase 1 wizard: current_step + pricing fields on postes/composants
ALTER TABLE consultations
    ADD COLUMN IF NOT EXISTS current_step INTEGER NOT NULL DEFAULT 1;

ALTER TABLE consultation_noeuds
    ADD COLUMN IF NOT EXISTS debours_sec NUMERIC(18, 2),
    ADD COLUMN IF NOT EXISTS frais_generaux_percent NUMERIC(8, 4) DEFAULT 8,
    ADD COLUMN IF NOT EXISTS marge_percent NUMERIC(8, 4) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS prix_vente_ht NUMERIC(18, 2);

ALTER TABLE consultation_composants
    ADD COLUMN IF NOT EXISTS quantite NUMERIC(18, 4),
    ADD COLUMN IF NOT EXISTS prix_unitaire NUMERIC(18, 4),
    ADD COLUMN IF NOT EXISTS total NUMERIC(18, 2);

-- Backfill composant quantite from indicative where missing
UPDATE consultation_composants
SET quantite = quantite_indicative
WHERE quantite IS NULL AND quantite_indicative IS NOT NULL;
