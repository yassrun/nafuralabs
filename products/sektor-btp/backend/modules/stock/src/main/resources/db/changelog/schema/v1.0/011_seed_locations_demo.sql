-- Demo seeds for stock locations (context seed-demo when enabled in lifecycle).
-- Aligned with web inventory mocks — tenant key 'nafura'.

INSERT INTO locations (
    id, tenant_id, code, name, type,
    is_physical, affects_stock, created_at, updated_at
)
SELECT gen_random_uuid(), t.id, 'MAG-CASA-01', 'Entrepôt central — Zone industrielle Aïn Sebaâ', 'ENTREPOT',
       true, true, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;

INSERT INTO locations (
    id, tenant_id, code, name, type,
    is_physical, affects_stock, created_at, updated_at
)
SELECT gen_random_uuid(), t.id, 'MAG-ASB-02', 'Annexe stockage Aïn Sebaâ', 'DEPOT',
       true, true, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;

INSERT INTO locations (
    id, tenant_id, code, name, type,
    is_physical, affects_stock, created_at, updated_at
)
SELECT gen_random_uuid(), t.id, 'MAG-TR-JORF', 'Aire de transit Jorf Lasfar', 'TRANSIT',
       true, true, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;

INSERT INTO locations (
    id, tenant_id, code, name, type,
    is_physical, affects_stock, created_at, updated_at
)
SELECT gen_random_uuid(), t.id, 'MAG-CH-ATL', 'Magasin chantier — Résidence Atlas', 'CHANTIER',
       true, true, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;

INSERT INTO locations (
    id, tenant_id, code, name, type,
    is_physical, affects_stock, created_at, updated_at
)
SELECT gen_random_uuid(), t.id, 'MAG-CH-ANF', 'Magasin chantier — Tour Anfa', 'CHANTIER',
       true, true, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;
