-- ERP document scan permissions — ventes BCC + Avoir
INSERT INTO role_permission (id, role_code, permission, created_at) VALUES
  ('a7b8c9d0-e1f2-4012-a345-6789abcdef01', 'BTP_DAF', 'ventes.bcc.scan', NOW()),
  ('b8c9d0e1-f2a3-4123-b456-789abcdef012', 'BTP_DAF', 'ventes.avoir.scan', NOW()),
  ('c9d0e1f2-a3b4-4234-c567-89abcdef0123', 'BTP_CONDUCTEUR_TRAVAUX', 'ventes.bcc.scan', NOW()),
  ('d0e1f2a3-b4c5-4345-d678-9abcdef01234', 'BTP_CHEF_CHANTIER', 'ventes.bcc.scan', NOW())
ON CONFLICT (role_code, permission) DO NOTHING;
