-- RH Lot 1: pointage UUID + unicité métier + audit validation
-- Voir docs/epics/rh-pointage-raffinement/00-PLAN.md §5 Lot 1 / ADR §7.3–7.4

-- ── 1. Dédoublonner avant UNIQUE ───────────────────────────────────────────
WITH ranked_pt AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY tenant_id, employe_id, date, chantier_id
               ORDER BY created_at DESC NULLS LAST, id
           ) AS rn
    FROM pointages
)
DELETE FROM pointages p
USING ranked_pt r
WHERE p.id = r.id AND r.rn > 1;

WITH ranked_batch AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY tenant_id, chantier_id, date_pointage
               ORDER BY created_at DESC NULLS LAST, id
           ) AS rn
    FROM pointage_batches
)
DELETE FROM pointages p
USING ranked_batch r
WHERE p.batch_id = r.id AND r.rn > 1;

WITH ranked_batch AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY tenant_id, chantier_id, date_pointage
               ORDER BY created_at DESC NULLS LAST, id
           ) AS rn
    FROM pointage_batches
)
DELETE FROM pointage_batches b
USING ranked_batch r
WHERE b.id = r.id AND r.rn > 1;

-- ── 2. Mapper anciens IDs → UUID ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS _rh_lot1_batch_id_map (
    old_id VARCHAR(100) PRIMARY KEY,
    new_id UUID NOT NULL
);

CREATE TABLE IF NOT EXISTS _rh_lot1_pointage_id_map (
    old_id VARCHAR(100) PRIMARY KEY,
    new_id UUID NOT NULL
);

INSERT INTO _rh_lot1_batch_id_map (old_id, new_id)
SELECT id, gen_random_uuid()
FROM pointage_batches
ON CONFLICT (old_id) DO NOTHING;

INSERT INTO _rh_lot1_pointage_id_map (old_id, new_id)
SELECT id, gen_random_uuid()
FROM pointages
ON CONFLICT (old_id) DO NOTHING;

-- ── 3. pointage_batches → UUID PK + colonnes audit ─────────────────────────
ALTER TABLE pointages DROP CONSTRAINT IF EXISTS pointages_batch_id_fkey;

ALTER TABLE pointage_batches ADD COLUMN IF NOT EXISTS id_uuid UUID;
UPDATE pointage_batches b
SET id_uuid = m.new_id
FROM _rh_lot1_batch_id_map m
WHERE b.id = m.old_id AND b.id_uuid IS NULL;

ALTER TABLE pointage_batches DROP CONSTRAINT IF EXISTS pointage_batches_pkey;
ALTER TABLE pointage_batches DROP COLUMN IF EXISTS id;
ALTER TABLE pointage_batches RENAME COLUMN id_uuid TO id;
ALTER TABLE pointage_batches ALTER COLUMN id SET NOT NULL;
ALTER TABLE pointage_batches ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE pointage_batches ADD PRIMARY KEY (id);

ALTER TABLE pointage_batches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE pointage_batches ADD COLUMN IF NOT EXISTS validated_by VARCHAR(100);
ALTER TABLE pointage_batches ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ;
UPDATE pointage_batches SET updated_at = COALESCE(updated_at, created_at, now());
ALTER TABLE pointage_batches ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE pointage_batches ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE pointage_batches DROP CONSTRAINT IF EXISTS uq_pointage_batches_tenant_client;
CREATE UNIQUE INDEX IF NOT EXISTS uq_pointage_batches_tenant_client_not_null
    ON pointage_batches (tenant_id, client_id)
    WHERE client_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_pointage_batches_tenant_chantier_date
    ON pointage_batches (tenant_id, chantier_id, date_pointage);

-- ── 4. pointages → UUID PK + batch_id UUID + audit ─────────────────────────
ALTER TABLE pointages ADD COLUMN IF NOT EXISTS id_uuid UUID;
UPDATE pointages p
SET id_uuid = m.new_id
FROM _rh_lot1_pointage_id_map m
WHERE p.id = m.old_id AND p.id_uuid IS NULL;

ALTER TABLE pointages ADD COLUMN IF NOT EXISTS batch_id_uuid UUID;
UPDATE pointages p
SET batch_id_uuid = m.new_id
FROM _rh_lot1_batch_id_map m
WHERE p.batch_id = m.old_id AND p.batch_id_uuid IS NULL;

ALTER TABLE pointages DROP CONSTRAINT IF EXISTS pointages_pkey;
ALTER TABLE pointages DROP COLUMN IF EXISTS id;
ALTER TABLE pointages DROP COLUMN IF EXISTS batch_id;
ALTER TABLE pointages RENAME COLUMN id_uuid TO id;
ALTER TABLE pointages RENAME COLUMN batch_id_uuid TO batch_id;
ALTER TABLE pointages ALTER COLUMN id SET NOT NULL;
ALTER TABLE pointages ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE pointages ALTER COLUMN batch_id SET NOT NULL;
ALTER TABLE pointages ADD PRIMARY KEY (id);

ALTER TABLE pointages
    ADD CONSTRAINT pointages_batch_id_fkey
    FOREIGN KEY (batch_id) REFERENCES pointage_batches(id) ON DELETE CASCADE;

ALTER TABLE pointages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE pointages ADD COLUMN IF NOT EXISTS validated_by VARCHAR(100);
ALTER TABLE pointages ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ;
UPDATE pointages SET updated_at = COALESCE(updated_at, created_at, now());
ALTER TABLE pointages ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE pointages ALTER COLUMN updated_at SET DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS uq_pointages_tenant_employe_date_chantier
    ON pointages (tenant_id, employe_id, date, chantier_id);

-- ── 5. heures_supplementaires.pointage_id → UUID (nullable) ────────────────
ALTER TABLE heures_supplementaires ADD COLUMN IF NOT EXISTS pointage_id_uuid UUID;
UPDATE heures_supplementaires hs
SET pointage_id_uuid = m.new_id
FROM _rh_lot1_pointage_id_map m
WHERE hs.pointage_id = m.old_id;

ALTER TABLE heures_supplementaires DROP COLUMN IF EXISTS pointage_id;
ALTER TABLE heures_supplementaires RENAME COLUMN pointage_id_uuid TO pointage_id;
CREATE INDEX IF NOT EXISTS idx_heures_sup_pointage
    ON heures_supplementaires (tenant_id, pointage_id);

-- ── 6. Cleanup maps ────────────────────────────────────────────────────────
DROP TABLE IF EXISTS _rh_lot1_batch_id_map;
DROP TABLE IF EXISTS _rh_lot1_pointage_id_map;
