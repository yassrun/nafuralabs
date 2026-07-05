-- ERP document scan permissions (F0-5)
-- Grants fine-grained scan actions separate from create/update flows.

INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('a1b2c3d4-e5f6-4789-a012-3456789abcde', 'BTP_DAF', 'stock.reception.scan', NOW()),
  ('b2c3d4e5-f6a7-4890-b123-456789abcdef', 'BTP_DAF', 'finance.ff.scan', NOW()),
  ('c3d4e5f6-a7b8-4901-c234-56789abcdef0', 'BTP_CONDUCTEUR_TRAVAUX', 'stock.reception.scan', NOW()),
  ('d4e5f6a7-b8c9-4012-d345-6789abcdef01', 'BTP_CONDUCTEUR_TRAVAUX', 'achats.commande.scan', NOW()),
  ('e5f6a7b8-c9d0-4123-e456-789abcdef012', 'BTP_CHEF_CHANTIER', 'stock.reception.scan', NOW()),
  ('f6a7b8c9-d0e1-4234-f567-89abcdef0123', 'BTP_CHEF_CHANTIER', 'achats.commande.scan', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;
