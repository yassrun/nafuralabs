-- ============================================================
-- IAM Bootstrap: Roles & Permissions
-- Auto-generated from naf/src/spec — DO NOT EDIT MANUALLY
-- Source: naf/src/spec/applications/erp/erp.application.json
-- ============================================================

-- Role: OWNER — Owner [system-default]
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('b04e326c-03a2-8276-1394-7a845870ec10', 'OWNER', '*', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;

-- Role: ADMIN — Administrator [system-default]
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('6984d2ce-d26a-7414-c262-71807758a4cb', 'ADMIN', '*', NOW()),
  ('f6fc8df3-d622-50cc-c366-cacfac9567c5', 'ADMIN', 'administration.*', NOW()),
  ('f3862e0a-a961-5fae-f921-f183133fbc9a', 'ADMIN', 'tenant.*', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;

-- Role: MANAGER — Manager [system-default]
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('3349d86e-40ec-f5f5-3683-c935f4709c09', 'MANAGER', 'administration.member.read', NOW()),
  ('86a8fcbe-2885-858f-f32a-075786c1e897', 'MANAGER', 'administration.role.read', NOW()),
  ('f081a964-5a5c-d62a-78da-0241027924dd', 'MANAGER', 'tenant.members.read', NOW()),
  ('61795f20-25bf-bdf1-fc84-df2d9afd506f', 'MANAGER', 'tenant.read', NOW()),
  ('bb8629da-9085-301a-232a-f9c3cadb9b34', 'MANAGER', 'tenant.roles.read', NOW()),
  ('67beb075-aed8-eee6-65e4-c8c9e569350a', 'MANAGER', 'tenant.settings.read', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;

-- Role: MEMBER — Member [system-default]
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('13b62c08-a6aa-b590-74ee-27e5bee988bb', 'MEMBER', 'tenant.read', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;

-- Role: VIEWER — Viewer [system-default]
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('945a4953-be14-471f-19ea-e516efc7033a', 'VIEWER', 'tenant.read', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;

-- Role: BTP_DG — BTP — Direction générale [app-level]
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('2f7cd620-358c-d0ef-3d9b-cbf1df521bbb', 'BTP_DG', '*', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;

-- Role: BTP_DAF — BTP — DAF [app-level]
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('73f9a718-a52c-c9d0-c5c9-c87a6ddc1350', 'BTP_DAF', 'achats.*', NOW()),
  ('f6dccc09-353b-8f82-eed2-33d02a17ec63', 'BTP_DAF', 'approbations.read', NOW()),
  ('5cad5478-90b7-01c5-14e6-03ddf24f47af', 'BTP_DAF', 'chantiers.read', NOW()),
  ('ab3db7db-7790-c5af-94e4-95be7c0c9670', 'BTP_DAF', 'currency.*', NOW()),
  ('bba2ea21-efe8-b6c2-0dea-b865fe998488', 'BTP_DAF', 'etudes.read', NOW()),
  ('2f5b5b70-64ba-873f-ae99-518c1bb3c9a2', 'BTP_DAF', 'hse.read', NOW()),
  ('47253b1b-01f4-bc9e-2419-85b4e6a796d2', 'BTP_DAF', 'item.read', NOW()),
  ('535610a9-a399-2334-48aa-0e0339c1d3f0', 'BTP_DAF', 'marches.*', NOW()),
  ('d3d855d7-3ffb-aa2b-eee0-b9918038c2ca', 'BTP_DAF', 'partner.*', NOW()),
  ('7381dd42-f02a-4cb3-0764-f5f43e782e91', 'BTP_DAF', 'rh.read', NOW()),
  ('5ef7e2eb-322f-cbbb-c11d-9c0578ad5f62', 'BTP_DAF', 'stock.read', NOW()),
  ('82ed5f1d-20ae-146c-3706-4a6e950da8dc', 'BTP_DAF', 'ventes.*', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;

-- Role: BTP_CONDUCTEUR_TRAVAUX — BTP — Conducteur de travaux [app-level]
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('9e0e95a1-187d-855f-d290-af627ebfd64c', 'BTP_CONDUCTEUR_TRAVAUX', 'achats.read', NOW()),
  ('dda8833c-4426-cb53-0f65-4c01d271a103', 'BTP_CONDUCTEUR_TRAVAUX', 'chantiers.*', NOW()),
  ('833f5a8a-1bcb-6aaa-d9f3-c913df1c3227', 'BTP_CONDUCTEUR_TRAVAUX', 'hse.*', NOW()),
  ('4a332aaa-95fe-2011-c5f9-3f37e2ba1bdf', 'BTP_CONDUCTEUR_TRAVAUX', 'item.read', NOW()),
  ('0470b2a7-1440-c161-cd5b-8087e2abf304', 'BTP_CONDUCTEUR_TRAVAUX', 'partner.read', NOW()),
  ('0f1b2a20-f904-ab4f-32c8-955def8801eb', 'BTP_CONDUCTEUR_TRAVAUX', 'rh.pointage.*', NOW()),
  ('55943315-977c-e9d7-3f85-aefa0053758f', 'BTP_CONDUCTEUR_TRAVAUX', 'rh.read', NOW()),
  ('ab2e8320-95b9-71ff-3088-a587c77725c8', 'BTP_CONDUCTEUR_TRAVAUX', 'stock.read', NOW()),
  ('495a9f97-2514-53d3-3f1f-bc4643de0029', 'BTP_CONDUCTEUR_TRAVAUX', 'ventes.read', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;

-- Role: BTP_CHEF_CHANTIER — BTP — Chef de chantier [app-level]
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('199bd2f8-ff69-a19c-6f03-532656538f16', 'BTP_CHEF_CHANTIER', 'achats.read', NOW()),
  ('a9c1a08b-fe31-5586-2ba7-d313a672dd0e', 'BTP_CHEF_CHANTIER', 'chantiers.avancement.*', NOW()),
  ('a3ed818b-8d10-72d9-36c3-01d4b5f03d2a', 'BTP_CHEF_CHANTIER', 'chantiers.photos.*', NOW()),
  ('09bff61e-888a-c870-6335-76c1424d97ba', 'BTP_CHEF_CHANTIER', 'chantiers.read', NOW()),
  ('3bfc1f04-5b15-a463-c85d-cc6910b7a1a3', 'BTP_CHEF_CHANTIER', 'hse.incident.create', NOW()),
  ('4383c732-11a8-0cc2-9068-1da84bc4a826', 'BTP_CHEF_CHANTIER', 'hse.read', NOW()),
  ('309effd6-807a-c62a-9967-57b8c03db34c', 'BTP_CHEF_CHANTIER', 'item.read', NOW()),
  ('051ece64-857a-f443-c4f1-1c4ca9ba8ff5', 'BTP_CHEF_CHANTIER', 'partner.read', NOW()),
  ('92b81f3a-00df-33dc-2c95-9044619f2408', 'BTP_CHEF_CHANTIER', 'rh.pointage.create', NOW()),
  ('05a7b723-d0f8-199e-2bdf-c67610da8e38', 'BTP_CHEF_CHANTIER', 'rh.pointage.read', NOW()),
  ('aeae8842-d3d1-a415-c789-d4c45f707fbc', 'BTP_CHEF_CHANTIER', 'stock.read', NOW()),
  ('64a97ff3-ad18-2e92-6e87-d801ca0d44dc', 'BTP_CHEF_CHANTIER', 'ventes.read', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;

-- ============================================================
-- Tenant Bootstrap: default tenant + tenant_domain (from manifest)
-- ============================================================

-- Default tenant: nafura
INSERT INTO tenant (id, key, name, type, owner_email, application_id, created_at, updated_at)
VALUES ('ab78763b-6aa9-684f-b979-7aa8506450f8', 'nafura', 'Nafura', 'standard', 'super.admin@nafuralabs.com', 'erp', NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, owner_email = EXCLUDED.owner_email, application_id = EXCLUDED.application_id, updated_at = NOW();

-- Tenant domains as declared in application manifest
INSERT INTO tenant_domain (id, tenant_id, domain_code, status, created_at, updated_at)
VALUES ('088ffc44-c986-7ea3-099e-79b45ea9e580', (SELECT id FROM tenant WHERE key = 'nafura'), 'item', 'ACTIVE', NOW(), NOW())
ON CONFLICT (tenant_id, domain_code) DO UPDATE SET status = 'ACTIVE', updated_at = NOW();

INSERT INTO tenant_domain (id, tenant_id, domain_code, status, created_at, updated_at)
VALUES ('ca6d2cd8-fef2-3f77-e23c-eaafccea28ed', (SELECT id FROM tenant WHERE key = 'nafura'), 'stock', 'ACTIVE', NOW(), NOW())
ON CONFLICT (tenant_id, domain_code) DO UPDATE SET status = 'ACTIVE', updated_at = NOW();

INSERT INTO tenant_domain (id, tenant_id, domain_code, status, created_at, updated_at)
VALUES ('d36e81dd-5283-b9ee-fca5-49d9cc9c27ad', (SELECT id FROM tenant WHERE key = 'nafura'), 'currency', 'ACTIVE', NOW(), NOW())
ON CONFLICT (tenant_id, domain_code) DO UPDATE SET status = 'ACTIVE', updated_at = NOW();

INSERT INTO tenant_domain (id, tenant_id, domain_code, status, created_at, updated_at)
VALUES ('92c7abc9-e344-0ca0-8087-cd160fc75bb1', (SELECT id FROM tenant WHERE key = 'nafura'), 'partner', 'ACTIVE', NOW(), NOW())
ON CONFLICT (tenant_id, domain_code) DO UPDATE SET status = 'ACTIVE', updated_at = NOW();

INSERT INTO tenant_domain (id, tenant_id, domain_code, status, created_at, updated_at)
VALUES ('4f4dfd19-6be4-8a1a-163a-473b96306fb3', (SELECT id FROM tenant WHERE key = 'nafura'), 'achats', 'ACTIVE', NOW(), NOW())
ON CONFLICT (tenant_id, domain_code) DO UPDATE SET status = 'ACTIVE', updated_at = NOW();

INSERT INTO tenant_domain (id, tenant_id, domain_code, status, created_at, updated_at)
VALUES ('a797560f-7e33-9073-afcc-62edfb462f81', (SELECT id FROM tenant WHERE key = 'nafura'), 'ventes', 'ACTIVE', NOW(), NOW())
ON CONFLICT (tenant_id, domain_code) DO UPDATE SET status = 'ACTIVE', updated_at = NOW();

INSERT INTO tenant_domain (id, tenant_id, domain_code, status, created_at, updated_at)
VALUES ('4abd72ca-51d4-8ace-d256-095a3dc3f0d7', (SELECT id FROM tenant WHERE key = 'nafura'), 'chantiers', 'ACTIVE', NOW(), NOW())
ON CONFLICT (tenant_id, domain_code) DO UPDATE SET status = 'ACTIVE', updated_at = NOW();

INSERT INTO tenant_domain (id, tenant_id, domain_code, status, created_at, updated_at)
VALUES ('173acb73-a40e-8ef6-9fe2-e6de26c2a4ce', (SELECT id FROM tenant WHERE key = 'nafura'), 'etudes', 'ACTIVE', NOW(), NOW())
ON CONFLICT (tenant_id, domain_code) DO UPDATE SET status = 'ACTIVE', updated_at = NOW();

INSERT INTO tenant_domain (id, tenant_id, domain_code, status, created_at, updated_at)
VALUES ('7b69e365-7d12-20c3-7b3c-2932ae07a368', (SELECT id FROM tenant WHERE key = 'nafura'), 'rh', 'ACTIVE', NOW(), NOW())
ON CONFLICT (tenant_id, domain_code) DO UPDATE SET status = 'ACTIVE', updated_at = NOW();

INSERT INTO tenant_domain (id, tenant_id, domain_code, status, created_at, updated_at)
VALUES ('be1fa108-fbb7-6fde-7a56-1022c572ecca', (SELECT id FROM tenant WHERE key = 'nafura'), 'hse', 'ACTIVE', NOW(), NOW())
ON CONFLICT (tenant_id, domain_code) DO UPDATE SET status = 'ACTIVE', updated_at = NOW();

INSERT INTO tenant_domain (id, tenant_id, domain_code, status, created_at, updated_at)
VALUES ('98b01823-5734-00d7-df5d-d9621136ffa7', (SELECT id FROM tenant WHERE key = 'nafura'), 'marches', 'ACTIVE', NOW(), NOW())
ON CONFLICT (tenant_id, domain_code) DO UPDATE SET status = 'ACTIVE', updated_at = NOW();

INSERT INTO tenant_domain (id, tenant_id, domain_code, status, created_at, updated_at)
VALUES ('b3305d8e-245b-d89f-1d19-23a4f791f29a', (SELECT id FROM tenant WHERE key = 'nafura'), 'approbations', 'ACTIVE', NOW(), NOW())
ON CONFLICT (tenant_id, domain_code) DO UPDATE SET status = 'ACTIVE', updated_at = NOW();

-- ============================================================
-- IAM Bootstrap: Users + tenant_membership + roles
-- ============================================================

-- User: super.admin@nafuralabs.com [scope: global]
INSERT INTO app_user (id, email, name, status, created_at, updated_at)
VALUES ('cc021ff5-3a7f-6636-5da7-e646027daa83', 'super.admin@nafuralabs.com', 'Super Admin', 'ACTIVE', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();

-- User: super.admin@nafuralabsalabs.local [scope: global]
INSERT INTO app_user (id, email, name, status, created_at, updated_at)
VALUES ('b0ef8df4-e8f1-162b-3e64-b3a60754c218', 'super.admin@nafuralabsalabs.local', 'Super Admin', 'ACTIVE', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();

