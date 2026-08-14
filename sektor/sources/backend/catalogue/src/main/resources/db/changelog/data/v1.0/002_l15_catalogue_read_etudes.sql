-- L15 : lecture catalogue + validation item_match pour rôle chiffrage (tenant)
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('c0a5b1d2-e3f4-4a15-9c01-000000000501', 'BTP_INGENIEUR', 'catalogue.read', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;
