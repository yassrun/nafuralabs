-- L14 : permissions console catalogue (hors app client métier)
-- Rôles éditoriaux : BTP_DG + BTP_DIRECTEUR_TRAVAUX (lab)

INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('c0a5b1d2-e3f4-4a14-9c01-000000000401', 'BTP_DG', 'catalogue.read', NOW()),
  ('c0a5b1d2-e3f4-4a14-9c01-000000000402', 'BTP_DG', 'catalogue.publish', NOW()),
  ('c0a5b1d2-e3f4-4a14-9c01-000000000403', 'BTP_DIRECTEUR_TRAVAUX', 'catalogue.read', NOW()),
  ('c0a5b1d2-e3f4-4a14-9c01-000000000404', 'BTP_DIRECTEUR_TRAVAUX', 'catalogue.publish', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;
