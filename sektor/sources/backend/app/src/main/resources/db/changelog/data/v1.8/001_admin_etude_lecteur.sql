-- Admin étude : plein pouvoir dossier (énuméré, pas de joker etude.*).
-- Lecteur : ouvrir / lister seulement — pour tester le RBAC étude en Mode B.
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('c0a5b1d2-e3f4-4a01-9c01-000000000801', 'BTP_ADMIN_ETUDE', 'etude.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000802', 'BTP_ADMIN_ETUDE', 'etude.create', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000803', 'BTP_ADMIN_ETUDE', 'etude.update', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000804', 'BTP_ADMIN_ETUDE', 'etude.delete', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000805', 'BTP_ADMIN_ETUDE', 'etude.submit', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000806', 'BTP_ADMIN_ETUDE', 'etude.approve', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000807', 'BTP_ADMIN_ETUDE', 'etude.avis', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000808', 'BTP_ADMIN_ETUDE', 'etude.go', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000809', 'BTP_ADMIN_ETUDE', 'etudes.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-00000000080a', 'BTP_ADMIN_ETUDE', 'etudes.etudes.dossier.etude.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-00000000080b', 'BTP_ADMIN_ETUDE', 'etudes.etudes.dossier.etude.create', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-00000000080c', 'BTP_ADMIN_ETUDE', 'etudes.etudes.dossier.etude.update', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-00000000080d', 'BTP_ADMIN_ETUDE', 'etudes.etudes.dossier.etude.submit', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-00000000080e', 'BTP_ADMIN_ETUDE', 'etudes.etudes.dossier.etude.avis', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-00000000080f', 'BTP_ADMIN_ETUDE', 'etudes.etudes.dossier.etude.go', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000810', 'BTP_ADMIN_ETUDE', 'etudes.etudes.dpgf.etudes.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000811', 'BTP_ADMIN_ETUDE', 'etudes.etudes.dpgf.etudes.update', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000812', 'BTP_ADMIN_ETUDE', 'etudes.etudes.dpu.etudes.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000813', 'BTP_ADMIN_ETUDE', 'etudes.etudes.dpu.etudes.update', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000814', 'BTP_ADMIN_ETUDE', 'etudes.etudes.dpu.etudes.create', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000821', 'BTP_LECTEUR_ETUDE', 'etude.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000822', 'BTP_LECTEUR_ETUDE', 'etudes.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000823', 'BTP_LECTEUR_ETUDE', 'etudes.etudes.dossier.etude.read', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;
