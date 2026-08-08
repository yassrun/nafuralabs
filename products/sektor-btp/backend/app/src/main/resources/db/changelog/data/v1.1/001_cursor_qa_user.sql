-- Cursor QA user for Mode B local auth bypass (no Keycloak).
-- Email: cursor.qa@nafuralabs.local — tenant Nafura bootstrap.

-- User
INSERT INTO app_user (id, email, name, status, created_at, updated_at)
VALUES (
    'c0a50100-c015-4000-a000-000000000001',
    'cursor.qa@nafuralabs.local',
    'Cursor QA',
    'ACTIVE',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    status = 'ACTIVE',
    updated_at = NOW();

-- Membership on Nafura tenant (from 001_iam_bootstrap_erp)
INSERT INTO tenant_membership (id, tenant_id, user_id, status, created_at, updated_at)
VALUES (
    'c0a50100-c015-4000-a000-000000000002',
    'ab78763b-6aa9-684f-b979-7aa8506450f8',
    'c0a50100-c015-4000-a000-000000000001',
    'ACTIVE',
    NOW(),
    NOW()
)
ON CONFLICT (tenant_id, user_id) DO UPDATE SET
    status = 'ACTIVE',
    updated_at = NOW();

-- Global SUPER_ADMIN (AuthController /me lookup)
INSERT INTO user_role (id, user_id, role_code, created_at, updated_at)
VALUES (
    'c0a50100-c015-4000-a000-000000000003',
    'c0a50100-c015-4000-a000-000000000001',
    'SUPER_ADMIN',
    NOW(),
    NOW()
)
ON CONFLICT (user_id, role_code) DO UPDATE SET
    updated_at = NOW();

-- Tenant-scoped SUPER_ADMIN
INSERT INTO tenant_user_role (id, tenant_id, user_id, role_code, created_at, updated_at)
VALUES (
    'c0a50100-c015-4000-a000-000000000004',
    'ab78763b-6aa9-684f-b979-7aa8506450f8',
    'c0a50100-c015-4000-a000-000000000001',
    'SUPER_ADMIN',
    NOW(),
    NOW()
)
ON CONFLICT (tenant_id, user_id, role_code) DO UPDATE SET
    updated_at = NOW();

-- Also BTP_INGENIEUR so Cursor QA apparaît dans le picker « chargé d'étude »
INSERT INTO tenant_user_role (id, tenant_id, user_id, role_code, created_at, updated_at)
VALUES (
    'c0a50100-c015-4000-a000-000000000005',
    'ab78763b-6aa9-684f-b979-7aa8506450f8',
    'c0a50100-c015-4000-a000-000000000001',
    'BTP_INGENIEUR',
    NOW(),
    NOW()
)
ON CONFLICT (tenant_id, user_id, role_code) DO UPDATE SET
    updated_at = NOW();

-- Cursor QA is a single-user local loop: allow author to approve own études.
INSERT INTO tenant_setting (id, tenant_id, setting_key, value)
VALUES (
    'c0a50100-c015-4000-a000-000000000010',
    'ab78763b-6aa9-684f-b979-7aa8506450f8',
    'etudes.auteurPeutValider',
    'true'
)
ON CONFLICT (tenant_id, setting_key) DO UPDATE SET
    value = EXCLUDED.value;

-- Zenit MOA master data for devis référentiels (ville / contact)
INSERT INTO partner_addresses (id, tenant_id, partner_id, type, ligne1, ville, pays, is_default, created_at, updated_at)
VALUES (
    'c0a50100-c015-4000-a000-000000000021',
    'ab78763b-6aa9-684f-b979-7aa8506450f8',
    '650d0025-8174-4c01-b2dc-2e80d2c27445',
    'SIEGE',
    'Agence Zenit',
    'Rabat',
    'MA',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    ville = EXCLUDED.ville,
    is_default = true,
    updated_at = NOW();

INSERT INTO partner_contacts (id, tenant_id, partner_id, nom, fonction, email, is_primary, created_at, updated_at)
VALUES (
    'c0a50100-c015-4000-a000-000000000022',
    'ab78763b-6aa9-684f-b979-7aa8506450f8',
    '650d0025-8174-4c01-b2dc-2e80d2c27445',
    'M. Alami',
    'MOA',
    'alami@zenit.test',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    nom = EXCLUDED.nom,
    is_primary = true,
    updated_at = NOW();
