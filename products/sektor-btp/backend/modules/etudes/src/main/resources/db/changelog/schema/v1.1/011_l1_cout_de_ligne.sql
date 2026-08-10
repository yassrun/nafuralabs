-- L1 référentiel-catalogue : coût de ligne (origine_cout, cout_unitaire, cout_revient)
-- Voir products/sektor-btp/docs/epics/referentiel-catalogue-sektor/

-- 1. Nouvelles colonnes
ALTER TABLE dpgf_noeuds
    ADD COLUMN IF NOT EXISTS origine_cout VARCHAR(20),
    ADD COLUMN IF NOT EXISTS cout_revient NUMERIC(18, 4),
    ADD COLUMN IF NOT EXISTS estimation_saisie_en VARCHAR(10),
    ADD COLUMN IF NOT EXISTS cout_deduit BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS forfait_partner_id UUID,
    ADD COLUMN IF NOT EXISTS forfait_offre_id UUID;

-- 2. Migrer mode → origine_cout (FOURNI devient ESTIME ; DECOMPOSE reste)
UPDATE dpgf_noeuds
SET origine_cout = CASE
        WHEN upper(mode) = 'DECOMPOSE' THEN 'DECOMPOSE'
        WHEN type = 'ARTICLE' THEN 'ESTIME'
        ELSE NULL
    END
WHERE type = 'ARTICLE' AND origine_cout IS NULL;

-- 3. Renommer prix_fourni_base → cout_unitaire
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'dpgf_noeuds' AND column_name = 'prix_fourni_base'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'dpgf_noeuds' AND column_name = 'cout_unitaire'
    ) THEN
        ALTER TABLE dpgf_noeuds RENAME COLUMN prix_fourni_base TO cout_unitaire;
    END IF;
END $$;

-- Si les deux existent (rejeu), fusionner puis dropper l'ancien
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'dpgf_noeuds' AND column_name = 'prix_fourni_base'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'dpgf_noeuds' AND column_name = 'cout_unitaire'
    ) THEN
        UPDATE dpgf_noeuds
        SET cout_unitaire = COALESCE(cout_unitaire, prix_fourni_base)
        WHERE cout_unitaire IS NULL AND prix_fourni_base IS NOT NULL;
        ALTER TABLE dpgf_noeuds DROP COLUMN prix_fourni_base;
    END IF;
END $$;

-- 4. Pour DECOMPOSE sans cout_unitaire : reprendre prix_unitaire comme approximation
--    (le sync DPU recalculera ; pré-prod OK)
UPDATE dpgf_noeuds
SET cout_unitaire = prix_unitaire
WHERE type = 'ARTICLE'
  AND origine_cout = 'DECOMPOSE'
  AND cout_unitaire IS NULL
  AND prix_unitaire IS NOT NULL;

-- 5. Drop mode
ALTER TABLE dpgf_noeuds DROP COLUMN IF EXISTS mode;

-- 6. Contraintes
ALTER TABLE dpgf_noeuds DROP CONSTRAINT IF EXISTS chk_dpgf_noeuds_origine_cout;
ALTER TABLE dpgf_noeuds
    ADD CONSTRAINT chk_dpgf_noeuds_origine_cout
        CHECK (origine_cout IS NULL OR origine_cout IN ('DECOMPOSE', 'FORFAIT', 'ESTIME'));

ALTER TABLE dpgf_noeuds DROP CONSTRAINT IF EXISTS chk_dpgf_noeuds_estimation_saisie;
ALTER TABLE dpgf_noeuds
    ADD CONSTRAINT chk_dpgf_noeuds_estimation_saisie
        CHECK (
            estimation_saisie_en IS NULL
            OR estimation_saisie_en IN ('COUT', 'VENTE')
        );

CREATE INDEX IF NOT EXISTS idx_dpgf_noeuds_origine_cout
    ON dpgf_noeuds (tenant_id, origine_cout)
    WHERE origine_cout IS NOT NULL;

COMMENT ON COLUMN dpgf_noeuds.cout_unitaire IS 'Coût pour UNE unité (avant FG et marge)';
COMMENT ON COLUMN dpgf_noeuds.cout_revient IS 'cout_unitaire × (1+FG%) — plancher, jamais saisi';
COMMENT ON COLUMN dpgf_noeuds.origine_cout IS 'DECOMPOSE | FORFAIT | ESTIME';
