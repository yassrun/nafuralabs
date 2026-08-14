-- L10 référentiel-catalogue : ouvrage composite (codes + inclure_frais_et_marge)
-- Voir sektor/docs/specs/epics/referentiel-catalogue-sektor/
-- Interdit : L12 capitalisation / corpus seed, table nomenclature versionnée.

-- ── ouvrages : codification + provenance ────────────────────────────────────

ALTER TABLE ouvrages
    ADD COLUMN IF NOT EXISTS code_lot VARCHAR(30),
    ADD COLUMN IF NOT EXISTS code_famille VARCHAR(30),
    ADD COLUMN IF NOT EXISTS origine VARCHAR(20),
    ADD COLUMN IF NOT EXISTS source_etude_id UUID,
    ADD COLUMN IF NOT EXISTS catalog_cle_stable VARCHAR(120);

UPDATE ouvrages
SET code_lot = COALESCE(NULLIF(TRIM(code_lot), ''), 'GROS_OEUVRE'),
    code_famille = COALESCE(
        NULLIF(TRIM(code_famille), ''),
        NULLIF(TRIM(category), ''),
        'DIVERS'
    ),
    origine = COALESCE(NULLIF(TRIM(origine), ''), 'SAISIE')
WHERE code_lot IS NULL
   OR code_famille IS NULL
   OR origine IS NULL;

ALTER TABLE ouvrages
    ALTER COLUMN code_lot SET DEFAULT 'GROS_OEUVRE',
    ALTER COLUMN code_famille SET DEFAULT 'DIVERS',
    ALTER COLUMN origine SET DEFAULT 'SAISIE';

ALTER TABLE ouvrages
    ALTER COLUMN code_lot SET NOT NULL,
    ALTER COLUMN code_famille SET NOT NULL,
    ALTER COLUMN origine SET NOT NULL;

ALTER TABLE ouvrages DROP CONSTRAINT IF EXISTS chk_ouvrages_origine;
ALTER TABLE ouvrages
    ADD CONSTRAINT chk_ouvrages_origine CHECK (
        origine IN ('SAISIE', 'ETUDE', 'CATALOGUE')
    );

CREATE INDEX IF NOT EXISTS idx_ouvrages_tenant_lot_famille
    ON ouvrages (tenant_id, code_lot, code_famille);

-- category conservée (legacy seed / API) — synchronisée côté service avec code_famille.

-- ── composants : sous-traitance = seule exception marge-sur-marge ────────────

ALTER TABLE composants_dpu
    ADD COLUMN IF NOT EXISTS inclure_frais_et_marge BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE composants_ouvrage
    ADD COLUMN IF NOT EXISTS inclure_frais_et_marge BOOLEAN NOT NULL DEFAULT false;
