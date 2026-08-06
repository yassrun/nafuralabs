-- Classification Lot 5: rattachement matériel ↔ article + cleanup item_types.
-- Voir docs/epics/classification-article/00-PLAN.md §4 Lot 5 / §5.2–5.3

-- §5.2 — compléter nature depuis item_types uniquement si nature absente
-- (article_type / nature gagne en conflit ; PRESTATION → SOUS_TRAITANCE)
UPDATE items i
SET nature = CASE UPPER(TRIM(it.code))
    WHEN 'MATERIAU' THEN 'MATIERE'
    WHEN 'CONSOMMABLE' THEN 'CONSOMMABLE'
    WHEN 'EQUIPEMENT' THEN 'MATERIEL'
    WHEN 'PRESTATION' THEN 'SOUS_TRAITANCE'
    ELSE 'MATIERE'
END
FROM item_types it
WHERE i.item_type_id = it.id
  AND (i.nature IS NULL OR TRIM(i.nature) = '');

-- §5.3 — anciennes familles : conserver inactives (réaffectation manuelle)
UPDATE item_categories
SET is_active = false,
    updated_at = now()
WHERE code IN ('GROS_OEUVRE', 'VRD', 'FINITIONS', 'EPI')
  AND COALESCE(is_active, true) = true;

-- Matériels : colonnes de rattachement
ALTER TABLE materiels ADD COLUMN IF NOT EXISTS item_id UUID;
ALTER TABLE materiels ADD COLUMN IF NOT EXISTS item_category_id UUID;

-- Backfill : créer un article nature MATERIEL pour chaque engin sans lien
INSERT INTO items (
    id, tenant_id, code, name, description, item_category_id,
    nature, poste_budget_id, is_active, created_at, updated_at
)
SELECT
    gen_random_uuid(),
    m.tenant_id,
    m.code,
    m.name,
    m.description,
    CASE
        WHEN m.famille_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            THEN m.famille_id::uuid
        ELSE NULL
    END,
    'MATERIEL',
    'MATERIEL',
    COALESCE(m.is_active, true),
    now(),
    now()
FROM materiels m
WHERE m.item_id IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM items i
      WHERE i.tenant_id = m.tenant_id AND i.code = m.code
  );

UPDATE materiels m
SET
    item_id = i.id,
    item_category_id = COALESCE(
        m.item_category_id,
        CASE
            WHEN m.famille_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                THEN m.famille_id::uuid
            ELSE NULL
        END,
        i.item_category_id
    ),
    updated_at = now()
FROM items i
WHERE i.tenant_id = m.tenant_id
  AND i.code = m.code
  AND m.item_id IS NULL;

DROP INDEX IF EXISTS idx_materiels_tenant_famille;

ALTER TABLE materiels DROP COLUMN IF EXISTS famille_id;
ALTER TABLE materiels DROP COLUMN IF EXISTS famille_name;

CREATE INDEX IF NOT EXISTS idx_materiels_tenant_category ON materiels (tenant_id, item_category_id);
CREATE INDEX IF NOT EXISTS idx_materiels_item ON materiels (item_id);

-- Drop legacy item_types
ALTER TABLE items DROP COLUMN IF EXISTS item_type_id;
DROP TABLE IF EXISTS item_types;
