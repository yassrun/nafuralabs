-- Ingénieur BTP : lire / chiffrer le DPGF (lots affectés). Les @RequirePermission("etudes.X")
-- sont préfixées en etudes.etudes.{dpgf|dpu}.etudes.X.
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('c0a5b1d2-e3f4-4a01-9c01-000000000701', 'BTP_INGENIEUR', 'etudes.etudes.dpgf.etudes.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000702', 'BTP_INGENIEUR', 'etudes.etudes.dpgf.etudes.update', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000703', 'BTP_INGENIEUR', 'etudes.etudes.dpu.etudes.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000704', 'BTP_INGENIEUR', 'etudes.etudes.dpu.etudes.update', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000705', 'BTP_INGENIEUR', 'etudes.etudes.dpu.etudes.create', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;
