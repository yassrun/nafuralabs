-- Boîte de notifications in-app : tout rôle métier doit pouvoir lire la sienne.
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('c0a5b1d2-e3f4-4a01-9c01-000000000910', 'BTP_INGENIEUR', 'collaboration.collaboration.notification.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000911', 'BTP_LECTEUR_ETUDE', 'collaboration.collaboration.notification.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000912', 'BTP_ASSISTANT_ETUDE', 'collaboration.collaboration.notification.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000913', 'BTP_ADMIN_ETUDE', 'collaboration.collaboration.notification.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000914', 'BTP_CONDUCTEUR_TRAVAUX', 'collaboration.collaboration.notification.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000915', 'BTP_DIRECTEUR_TRAVAUX', 'collaboration.collaboration.notification.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000916', 'BTP_DAF', 'collaboration.collaboration.notification.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000917', 'BTP_DG', 'collaboration.collaboration.notification.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000918', 'BTP_CHEF_CHANTIER', 'collaboration.collaboration.notification.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000919', 'BTP_MAGASINIER', 'collaboration.collaboration.notification.read', NOW())
ON CONFLICT (id) DO NOTHING;
