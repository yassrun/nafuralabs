-- Assistante / saisie étude : créer et remplir le cadrage + pièces.
-- Pas de soumission, GO, validation, avis, ni suppression.
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('c0a5b1d2-e3f4-4a01-9c01-000000000831', 'BTP_ASSISTANT_ETUDE', 'etude.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000832', 'BTP_ASSISTANT_ETUDE', 'etude.create', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000833', 'BTP_ASSISTANT_ETUDE', 'etude.update', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000834', 'BTP_ASSISTANT_ETUDE', 'etudes.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000835', 'BTP_ASSISTANT_ETUDE', 'etudes.etudes.dossier.etude.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000836', 'BTP_ASSISTANT_ETUDE', 'etudes.etudes.dossier.etude.create', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000837', 'BTP_ASSISTANT_ETUDE', 'etudes.etudes.dossier.etude.update', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;
