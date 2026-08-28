-- SEKTOR-215 AC-10 — trace décision Catalogue sur composants autrefois LIBRE

ALTER TABLE composants_dpu
    ADD COLUMN IF NOT EXISTS decision_catalogue VARCHAR(30),
    ADD COLUMN IF NOT EXISTS decision_catalogue_motif VARCHAR(500),
    ADD COLUMN IF NOT EXISTS decision_catalogue_par VARCHAR(100),
    ADD COLUMN IF NOT EXISTS decision_catalogue_at TIMESTAMPTZ;

ALTER TABLE composants_dpu
    DROP CONSTRAINT IF EXISTS chk_composants_dpu_decision_catalogue;

ALTER TABLE composants_dpu
    ADD CONSTRAINT chk_composants_dpu_decision_catalogue CHECK (
        decision_catalogue IS NULL
        OR decision_catalogue IN (
            'POSTE_SEULEMENT',
            'CREE_ET_LIE',
            'RATTACHE_EXISTANT',
            'IGNORE_MOTIF'
        )
    );

CREATE INDEX IF NOT EXISTS idx_composants_dpu_decision_catalogue
    ON composants_dpu (tenant_id, decision_catalogue)
    WHERE decision_catalogue IS NOT NULL;
