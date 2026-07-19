-- Lot 9 T9.3 — enrichir catalogue fournisseur (dates, devise, remise, historisation)

ALTER TABLE catalogue_fournisseur_lignes
    DROP CONSTRAINT IF EXISTS uq_catalogue_fournisseur_lignes_tenant_fournisseur_article;

ALTER TABLE catalogue_fournisseur_lignes
    ADD COLUMN IF NOT EXISTS currency_id UUID,
    ADD COLUMN IF NOT EXISTS valid_from DATE,
    ADD COLUMN IF NOT EXISTS valid_to DATE,
    ADD COLUMN IF NOT EXISTS remise_percent NUMERIC(8,4) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS quantite_min NUMERIC(18,4),
    ADD COLUMN IF NOT EXISTS delai_jours INT,
    ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'SAISIE_MANUELLE',
    ADD COLUMN IF NOT EXISTS source_ref_id UUID,
    ADD COLUMN IF NOT EXISTS incoterm VARCHAR(20);

-- Backfill valid_from + devise pivot
UPDATE catalogue_fournisseur_lignes cfl
SET valid_from = CURRENT_DATE
WHERE valid_from IS NULL;

UPDATE catalogue_fournisseur_lignes cfl
SET currency_id = c.id
FROM currencies c
WHERE c.tenant_id = cfl.tenant_id
  AND c.is_reference = true
  AND cfl.currency_id IS NULL;

ALTER TABLE catalogue_fournisseur_lignes
    ALTER COLUMN valid_from SET NOT NULL,
    ALTER COLUMN valid_from SET DEFAULT CURRENT_DATE;

-- Une seule ligne « ouverte » (valid_to IS NULL) par couple fournisseur/article actif
CREATE UNIQUE INDEX IF NOT EXISTS uq_cat_fourn_open_ligne
    ON catalogue_fournisseur_lignes (tenant_id, fournisseur_id, article_id)
    WHERE actif = true AND valid_to IS NULL;

CREATE INDEX IF NOT EXISTS cat_fourn_lookup_idx
    ON catalogue_fournisseur_lignes (tenant_id, article_id, valid_from DESC)
    WHERE actif = true;
