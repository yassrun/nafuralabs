-- Demo seeds for item referentials (context seed-demo when enabled in lifecycle).
-- Aligned with web inventory mocks — tenant key 'nafura'.

-- UoM categories
INSERT INTO uom_category (id, tenant_id, code, name, is_active, created_at, updated_at)
SELECT gen_random_uuid(), t.id, 'MASSE', 'Masse', true, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;

INSERT INTO uom_category (id, tenant_id, code, name, is_active, created_at, updated_at)
SELECT gen_random_uuid(), t.id, 'VOLUME', 'Volume', true, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;

INSERT INTO uom_category (id, tenant_id, code, name, is_active, created_at, updated_at)
SELECT gen_random_uuid(), t.id, 'COUNT', 'Comptage', true, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;

-- Units of measure
INSERT INTO unit_of_measure (id, tenant_id, code, name, uom_category_id, is_active, created_at, updated_at)
SELECT gen_random_uuid(), t.id, 'T', 'Tonne', uc.id, true, now(), now()
FROM tenant t
JOIN uom_category uc ON uc.tenant_id = t.id AND uc.code = 'MASSE'
WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;

INSERT INTO unit_of_measure (id, tenant_id, code, name, uom_category_id, is_active, created_at, updated_at)
SELECT gen_random_uuid(), t.id, 'M3', 'Mètre cube', uc.id, true, now(), now()
FROM tenant t
JOIN uom_category uc ON uc.tenant_id = t.id AND uc.code = 'VOLUME'
WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;

INSERT INTO unit_of_measure (id, tenant_id, code, name, uom_category_id, is_active, created_at, updated_at)
SELECT gen_random_uuid(), t.id, 'EA', 'Unité', uc.id, true, now(), now()
FROM tenant t
JOIN uom_category uc ON uc.tenant_id = t.id AND uc.code = 'COUNT'
WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;

-- Item categories (familles)
INSERT INTO item_categories (id, tenant_id, code, name, description, is_active, created_at, updated_at)
SELECT gen_random_uuid(), t.id, 'GROS_OEUVRE', 'Gros œuvre', 'Matériaux de structure', true, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;

INSERT INTO item_categories (id, tenant_id, code, name, description, is_active, created_at, updated_at)
SELECT gen_random_uuid(), t.id, 'VRD', 'VRD', 'Voirie et réseaux divers', true, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;

INSERT INTO item_categories (id, tenant_id, code, name, description, is_active, created_at, updated_at)
SELECT gen_random_uuid(), t.id, 'FINITIONS', 'Finitions', 'Peinture, revêtements', true, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;

-- Item types
INSERT INTO item_types (id, tenant_id, code, name, description, is_active, created_at, updated_at)
SELECT gen_random_uuid(), t.id, 'MATERIAU', 'Matériau', 'Matériaux de chantier', true, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;

INSERT INTO item_types (id, tenant_id, code, name, description, is_active, created_at, updated_at)
SELECT gen_random_uuid(), t.id, 'CONSOMMABLE', 'Consommable', 'Consommables et EPI', true, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;

-- Items (articles) — minimal set for GET /api/v1/items smoke tests
INSERT INTO items (
    id, tenant_id, code, name, description,
    item_category_id, item_type_id, unit_of_measure_id,
    article_type, prix_unitaire, pmp, stock_min, stock_max, delai_reappro_jours,
    is_active, created_at, updated_at
)
SELECT
    gen_random_uuid(), t.id, 'MAT-CIM', 'Ciment CPJ 45', 'Ciment Portland composé 45',
    ic.id, it.id, uom.id,
    'MATERIAU', 950.0000, 952.0000, 150.0000, 500.0000, 5,
    true, now(), now()
FROM tenant t
JOIN item_categories ic ON ic.tenant_id = t.id AND ic.code = 'GROS_OEUVRE'
JOIN item_types it ON it.tenant_id = t.id AND it.code = 'MATERIAU'
JOIN unit_of_measure uom ON uom.tenant_id = t.id AND uom.code = 'T'
WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;

INSERT INTO items (
    id, tenant_id, code, name, description,
    item_category_id, item_type_id, unit_of_measure_id,
    article_type, prix_unitaire, pmp, stock_min, stock_max, delai_reappro_jours,
    is_active, created_at, updated_at
)
SELECT
    gen_random_uuid(), t.id, 'MAT-FER', 'Fer à béton HA12', 'Armature acier haute adhérence Ø12',
    ic.id, it.id, uom.id,
    'MATERIAU', 7800.0000, 7820.0000, 50.0000, 200.0000, 14,
    true, now(), now()
FROM tenant t
JOIN item_categories ic ON ic.tenant_id = t.id AND ic.code = 'GROS_OEUVRE'
JOIN item_types it ON it.tenant_id = t.id AND it.code = 'MATERIAU'
JOIN unit_of_measure uom ON uom.tenant_id = t.id AND uom.code = 'T'
WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;

INSERT INTO items (
    id, tenant_id, code, name, description,
    item_category_id, item_type_id, unit_of_measure_id,
    article_type, prix_unitaire, pmp, stock_min, stock_max, delai_reappro_jours,
    is_active, created_at, updated_at
)
SELECT
    gen_random_uuid(), t.id, 'MAT-SAB', 'Sable fin', 'Sable fin pour mortier et enduit',
    ic.id, it.id, uom.id,
    'MATERIAU', 220.0000, 218.0000, 80.0000, 400.0000, 3,
    true, now(), now()
FROM tenant t
JOIN item_categories ic ON ic.tenant_id = t.id AND ic.code = 'VRD'
JOIN item_types it ON it.tenant_id = t.id AND it.code = 'MATERIAU'
JOIN unit_of_measure uom ON uom.tenant_id = t.id AND uom.code = 'M3'
WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;
