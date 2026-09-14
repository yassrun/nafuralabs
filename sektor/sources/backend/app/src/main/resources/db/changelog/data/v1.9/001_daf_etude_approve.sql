-- Validateur financier (FINANCIAL_APPROVER) : approuver / refuser une étude terminée.
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('c0a5b1d2-e3f4-4a01-9c01-000000000901', 'BTP_DAF', 'etude.approve', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000902', 'BTP_DAF', 'etudes.etudes.dossier.etude.approve', NOW())
ON CONFLICT (id) DO NOTHING;
