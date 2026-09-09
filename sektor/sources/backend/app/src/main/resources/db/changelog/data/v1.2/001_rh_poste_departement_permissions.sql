-- SEKTOR-331 — lecture des référentiels RH pour les rôles qui ont déjà rh.read.
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('b7e1c2d3-a4f5-4601-9011-700000000001', 'BTP_DAF', 'rh.postes.read', NOW()),
  ('b7e1c2d3-a4f5-4601-9011-700000000002', 'BTP_DAF', 'rh.departements.read', NOW()),
  ('b7e1c2d3-a4f5-4601-9011-700000000003', 'BTP_CONDUCTEUR_TRAVAUX', 'rh.postes.read', NOW()),
  ('b7e1c2d3-a4f5-4601-9011-700000000004', 'BTP_CONDUCTEUR_TRAVAUX', 'rh.departements.read', NOW()),
  ('b7e1c2d3-a4f5-4601-9011-700000000005', 'BTP_DIRECTEUR_TRAVAUX', 'rh.postes.read', NOW()),
  ('b7e1c2d3-a4f5-4601-9011-700000000006', 'BTP_DIRECTEUR_TRAVAUX', 'rh.departements.read', NOW()),
  ('b7e1c2d3-a4f5-4601-9011-700000000007', 'BTP_POINTEUR', 'rh.postes.read', NOW()),
  ('b7e1c2d3-a4f5-4601-9011-700000000008', 'BTP_POINTEUR', 'rh.departements.read', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;
