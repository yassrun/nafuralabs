-- DG : archiver / rejeter depuis À affecter (etude.update namespaced).
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('c0a5b1d2-e3f4-4a01-9c01-000000000410', 'BTP_DG', 'etudes.etudes.dossier.etude.update', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000411', 'BTP_DG', 'etude.update', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;
