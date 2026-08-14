-- L4 : supprimer jokers etude.* ; énumérer permissions ; ajouter etude.avis
-- Idempotent pour environnements ayant déjà appliqué 002_iam_bootstrap_erp_btp_roles.sql

DELETE FROM role_permission
WHERE permission = 'etude.*';

-- Directeur travaux — permissions énumérées (plus de joker)
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('c0a5b1d2-e3f4-4a01-9c01-000000000211', 'BTP_DIRECTEUR_TRAVAUX', 'etude.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000212', 'BTP_DIRECTEUR_TRAVAUX', 'etude.update', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000213', 'BTP_DIRECTEUR_TRAVAUX', 'etude.avis', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;
-- submit / approve / delete déjà présents dans 002

-- Conducteur — plus de joker, plus d'approve : lecture + avis
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('c0a5b1d2-e3f4-4a01-9c01-000000000214', 'BTP_CONDUCTEUR_TRAVAUX', 'etude.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000215', 'BTP_CONDUCTEUR_TRAVAUX', 'etude.avis', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;

-- Chef de chantier — lecture + avis
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('c0a5b1d2-e3f4-4a01-9c01-000000000216', 'BTP_CHEF_CHANTIER', 'etude.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000217', 'BTP_CHEF_CHANTIER', 'etude.avis', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;
