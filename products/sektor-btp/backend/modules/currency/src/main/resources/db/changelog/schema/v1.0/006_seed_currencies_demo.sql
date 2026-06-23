-- Demo seeds for currencies (context seed-demo when enabled in lifecycle).
-- Tenant key 'nafura' — MAD as reference currency for BTP ERP.

INSERT INTO currencies (
    id, tenant_id, code, name, symbol, decimal_places,
    is_active, is_reference, created_at, updated_at
)
SELECT gen_random_uuid(), t.id, 'MAD', 'Dirham marocain', 'DH', 2,
       true, true, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;

INSERT INTO currencies (
    id, tenant_id, code, name, symbol, decimal_places,
    is_active, is_reference, created_at, updated_at
)
SELECT gen_random_uuid(), t.id, 'EUR', 'Euro', '€', 2,
       true, false, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;

INSERT INTO currencies (
    id, tenant_id, code, name, symbol, decimal_places,
    is_active, is_reference, created_at, updated_at
)
SELECT gen_random_uuid(), t.id, 'USD', 'Dollar américain', '$', 2,
       true, false, now(), now()
FROM tenant t WHERE t.key = 'nafura'
ON CONFLICT DO NOTHING;
