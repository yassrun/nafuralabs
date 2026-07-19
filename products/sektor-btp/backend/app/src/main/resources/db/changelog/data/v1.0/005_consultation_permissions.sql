-- Consultation engine permissions (module sektor:consultation)
-- OWNER / ADMIN / BTP_DG already hold '*' via 001_iam_bootstrap_erp.sql.

-- Directeur travaux + Directeur études profiles: full consultation lifecycle
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('c0a5b1d2-e3f4-4a01-9c01-000000000101', 'BTP_DIRECTEUR_TRAVAUX', 'consultation.*', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000102', 'BTP_CONDUCTEUR_TRAVAUX', 'consultation.*', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;

-- DAF: read consultations (procurement oversight)
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('c0a5b1d2-e3f4-4a01-9c01-000000000103', 'BTP_DAF', 'consultation.read', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;

-- Ingénieur études: read + build consultations
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('c0a5b1d2-e3f4-4a01-9c01-000000000104', 'BTP_INGENIEUR', 'consultation.read', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000105', 'BTP_INGENIEUR', 'consultation.create', NOW()),
  ('c0a5b1d2-e3f4-4a01-9c01-000000000106', 'BTP_INGENIEUR', 'consultation.update', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;
