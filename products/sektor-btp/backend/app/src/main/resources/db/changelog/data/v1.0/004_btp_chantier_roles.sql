-- New BTP chantier roles + chantiers.viewAll for entreprise-scoped roles
-- Complements 001_iam_bootstrap_erp.sql (app-level BTP roles)

-- Role: BTP_DIRECTEUR_TRAVAUX
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('a1b2c3d4-e5f6-4701-a111-111111111101', 'BTP_DIRECTEUR_TRAVAUX', 'chantiers.*', NOW()),
  ('a1b2c3d4-e5f6-4701-a111-111111111102', 'BTP_DIRECTEUR_TRAVAUX', 'chantiers.viewAll', NOW()),
  ('a1b2c3d4-e5f6-4701-a111-111111111103', 'BTP_DIRECTEUR_TRAVAUX', 'marches.read', NOW()),
  ('a1b2c3d4-e5f6-4701-a111-111111111104', 'BTP_DIRECTEUR_TRAVAUX', 'achats.read', NOW()),
  ('a1b2c3d4-e5f6-4701-a111-111111111105', 'BTP_DIRECTEUR_TRAVAUX', 'achats.analytics.read', NOW()),
  ('a1b2c3d4-e5f6-4701-a111-111111111106', 'BTP_DIRECTEUR_TRAVAUX', 'achats.kpis.read', NOW()),
  ('a1b2c3d4-e5f6-4701-a111-111111111107', 'BTP_DIRECTEUR_TRAVAUX', 'approbations.requests.read', NOW()),
  ('a1b2c3d4-e5f6-4701-a111-111111111108', 'BTP_DIRECTEUR_TRAVAUX', 'approbations.requests.update', NOW()),
  ('a1b2c3d4-e5f6-4701-a111-111111111109', 'BTP_DIRECTEUR_TRAVAUX', 'approbations.matrice-pouvoirs.read', NOW()),
  ('a1b2c3d4-e5f6-4701-a111-11111111110a', 'BTP_DIRECTEUR_TRAVAUX', 'approbations.delegations.*', NOW()),
  ('a1b2c3d4-e5f6-4701-a111-11111111110b', 'BTP_DIRECTEUR_TRAVAUX', 'rh.read', NOW()),
  ('a1b2c3d4-e5f6-4701-a111-11111111110c', 'BTP_DIRECTEUR_TRAVAUX', 'hse.*', NOW()),
  ('a1b2c3d4-e5f6-4701-a111-11111111110d', 'BTP_DIRECTEUR_TRAVAUX', 'ventes.read', NOW()),
  ('a1b2c3d4-e5f6-4701-a111-11111111110e', 'BTP_DIRECTEUR_TRAVAUX', 'stock.read', NOW()),
  ('a1b2c3d4-e5f6-4701-a111-11111111110f', 'BTP_DIRECTEUR_TRAVAUX', 'partner.read', NOW()),
  ('a1b2c3d4-e5f6-4701-a111-111111111110', 'BTP_DIRECTEUR_TRAVAUX', 'item.read', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;

-- Role: BTP_CHEF_EQUIPE
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('b2c3d4e5-f6a7-4802-b222-222222222201', 'BTP_CHEF_EQUIPE', 'chantiers.read', NOW()),
  ('b2c3d4e5-f6a7-4802-b222-222222222202', 'BTP_CHEF_EQUIPE', 'chantiers.avancement.*', NOW()),
  ('b2c3d4e5-f6a7-4802-b222-222222222203', 'BTP_CHEF_EQUIPE', 'chantiers.photos.*', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;

-- Role: BTP_MAGASINIER
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('c3d4e5f6-a7b8-4903-c333-333333333301', 'BTP_MAGASINIER', 'stock.*', NOW()),
  ('c3d4e5f6-a7b8-4903-c333-333333333302', 'BTP_MAGASINIER', 'item.read', NOW()),
  ('c3d4e5f6-a7b8-4903-c333-333333333303', 'BTP_MAGASINIER', 'chantiers.read', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;

-- Role: BTP_POINTEUR
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('d4e5f6a7-b8c9-4a04-d444-444444444401', 'BTP_POINTEUR', 'rh.pointage.*', NOW()),
  ('d4e5f6a7-b8c9-4a04-d444-444444444402', 'BTP_POINTEUR', 'chantiers.read', NOW()),
  ('d4e5f6a7-b8c9-4a04-d444-444444444403', 'BTP_POINTEUR', 'rh.read', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;

-- Role: BTP_INGENIEUR (optional chantier role matching legacy field)
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('e5f6a7b8-c9d0-4b05-e555-555555555501', 'BTP_INGENIEUR', 'chantiers.read', NOW()),
  ('e5f6a7b8-c9d0-4b05-e555-555555555502', 'BTP_INGENIEUR', 'chantiers.avancement.read', NOW()),
  ('e5f6a7b8-c9d0-4b05-e555-555555555503', 'BTP_INGENIEUR', 'etudes.read', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;

-- Grant chantiers.viewAll to entreprise-scoped roles
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('f6a7b8c9-d0e1-4c06-f666-666666666601', 'BTP_DG', 'chantiers.viewAll', NOW()),
  ('f6a7b8c9-d0e1-4c06-f666-666666666602', 'BTP_DAF', 'chantiers.viewAll', NOW()),
  ('f6a7b8c9-d0e1-4c06-f666-666666666603', 'OWNER', 'chantiers.viewAll', NOW()),
  ('f6a7b8c9-d0e1-4c06-f666-666666666604', 'ADMIN', 'chantiers.viewAll', NOW()),
  ('f6a7b8c9-d0e1-4c06-f666-666666666605', 'BTP_CONDUCTEUR_TRAVAUX', 'approbations.requests.read', NOW()),
  ('f6a7b8c9-d0e1-4c06-f666-666666666606', 'BTP_CONDUCTEUR_TRAVAUX', 'approbations.requests.update', NOW()),
  ('f6a7b8c9-d0e1-4c06-f666-666666666607', 'BTP_CHEF_CHANTIER', 'approbations.requests.read', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;
