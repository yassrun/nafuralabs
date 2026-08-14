-- L3 référentiel-catalogue : facteur vers base + unité de base unique par catégorie
-- Voir sektor/docs/epics/referentiel-catalogue-sektor/

ALTER TABLE unit_of_measure
    ADD COLUMN IF NOT EXISTS facteur_vers_base NUMERIC(18, 8) NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS est_base BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE unit_of_measure
    DROP CONSTRAINT IF EXISTS chk_unit_of_measure_facteur_positif;

ALTER TABLE unit_of_measure
    ADD CONSTRAINT chk_unit_of_measure_facteur_positif
        CHECK (facteur_vers_base > 0);

-- Exactement une unité de base par (tenant, catégorie)
CREATE UNIQUE INDEX IF NOT EXISTS uq_unit_of_measure_base_per_category
    ON unit_of_measure (tenant_id, uom_category_id)
    WHERE est_base = true AND uom_category_id IS NOT NULL;

-- Catégorie SURFACE (séparée de LONGUEUR) pour chaque tenant déjà présent
INSERT INTO uom_category (id, tenant_id, code, name, description, is_active, created_at, updated_at)
SELECT gen_random_uuid(),
       t.tenant_id,
       'SURFACE',
       'Surface',
       'Surfaces et aires',
       true,
       now(),
       now()
FROM (SELECT DISTINCT tenant_id FROM uom_category) t
WHERE NOT EXISTS (
    SELECT 1
    FROM uom_category c
    WHERE c.tenant_id = t.tenant_id
      AND upper(c.code) = 'SURFACE'
);

-- Déplacer M2 vers SURFACE
UPDATE unit_of_measure u
SET uom_category_id = c.id,
    updated_at = now()
FROM uom_category c
WHERE u.tenant_id = c.tenant_id
  AND upper(u.code) = 'M2'
  AND upper(c.code) = 'SURFACE';

-- Facteurs et bases connus (pré-production / tenants existants)
UPDATE unit_of_measure SET facteur_vers_base = 1,     est_base = true,  updated_at = now() WHERE upper(code) = 'KG';
UPDATE unit_of_measure SET facteur_vers_base = 1000,  est_base = false, updated_at = now() WHERE upper(code) = 'T';
UPDATE unit_of_measure SET facteur_vers_base = 0.001, est_base = false, updated_at = now() WHERE upper(code) = 'G';

UPDATE unit_of_measure SET facteur_vers_base = 1,     est_base = true,  updated_at = now() WHERE upper(code) = 'L';
UPDATE unit_of_measure SET facteur_vers_base = 1000,  est_base = false, updated_at = now() WHERE upper(code) = 'M3';
UPDATE unit_of_measure SET facteur_vers_base = 0.001, est_base = false, updated_at = now() WHERE upper(code) = 'MLT';

UPDATE unit_of_measure SET facteur_vers_base = 1,     est_base = true,  updated_at = now() WHERE upper(code) = 'ML';
UPDATE unit_of_measure SET facteur_vers_base = 0.01,  est_base = false, updated_at = now() WHERE upper(code) = 'CM';

UPDATE unit_of_measure SET facteur_vers_base = 1,     est_base = true,  updated_at = now() WHERE upper(code) = 'M2';

UPDATE unit_of_measure SET facteur_vers_base = 1,     est_base = true,  updated_at = now() WHERE upper(code) = 'U';
UPDATE unit_of_measure SET facteur_vers_base = 1,     est_base = false, updated_at = now() WHERE upper(code) IN ('EA', 'LOT');

UPDATE unit_of_measure SET facteur_vers_base = 1,     est_base = true,  updated_at = now() WHERE upper(code) = 'H';
-- Journée ouvrée BTP = 8 h (documenté L3)
UPDATE unit_of_measure SET facteur_vers_base = 8,     est_base = false, updated_at = now() WHERE upper(code) = 'J';
